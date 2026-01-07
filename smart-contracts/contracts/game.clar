;; =============================================================================
;; TOURNAMENT GAME CONTRACT
;; =============================================================================
;;
;; Tournament-based score submission with server-side signature verification.
;; Each tournament has independent scores and nonces - when a new tournament
;; starts, all users begin fresh.
;;
;; FLOW:
;;   1. Admin starts a tournament (or uses default tournament 1)
;;   2. User plays game, backend records score
;;   3. Backend signs: sha256(DOMAIN || user || tournament || score || nonce)
;;   4. User submits (tournament-id, score, nonce, signature) to this contract
;;   5. Contract verifies signature matches SERVER-PUBKEY
;;   6. Score is stored on-chain for that tournament
;;
;; SECURITY:
;;   - Nonce prevents replay attacks (must be > last used nonce PER TOURNAMENT)
;;   - Signature ensures only server-approved scores are accepted
;;   - User principal + tournament-id included in hash to prevent cross-attacks
;;
;; =============================================================================

;; -----------------------------------------------------------------------------
;; ERRORS
;; -----------------------------------------------------------------------------
(define-constant ERR_INVALID_SIG (err u100))
(define-constant ERR_REPLAY_NONCE (err u101))
(define-constant ERR_BAD_SCORE (err u102))
(define-constant ERR_UNAUTHORIZED (err u103))
(define-constant ERR_INVALID_TOURNAMENT (err u104))

;; -----------------------------------------------------------------------------
;; CONSTANTS
;; -----------------------------------------------------------------------------
(define-constant DOMAIN 0x47414d452d5632) ;; "GAME-V2"
(define-constant CONTRACT_OWNER tx-sender)

;; Backend public key (33 bytes compressed secp256k1)
(define-constant SERVER-PUBKEY 0x039426af7f2591b254627d950b44d1141a82a40cbe9558be44bd187e6d54aff156)

;; -----------------------------------------------------------------------------
;; DATA VARS
;; -----------------------------------------------------------------------------
(define-data-var current-tournament-id uint u1)

;; -----------------------------------------------------------------------------
;; MAPS
;; -----------------------------------------------------------------------------

;; Track last nonce per user per tournament (resets each tournament)
(define-map user-last-nonce
  {
    user: principal,
    tournament-id: uint,
  }
  { nonce: uint }
)

;; Store user scores per tournament
(define-map user-scores
  {
    user: principal,
    tournament-id: uint,
  }
  {
    high-score: uint,
    total-score: uint,
    submissions: uint,
    last-nonce: uint,
    last-height: uint,
  }
)

;; Tournament metadata
(define-map tournaments
  { tournament-id: uint }
  {
    start-height: uint,
    end-height: uint,
    active: bool,
  }
)

;; -----------------------------------------------------------------------------
;; READ-ONLY FUNCTIONS
;; -----------------------------------------------------------------------------

(define-read-only (get-current-tournament)
  (var-get current-tournament-id)
)

(define-read-only (get-tournament-info (tournament-id uint))
  (map-get? tournaments { tournament-id: tournament-id })
)

(define-read-only (get-user-score
    (user principal)
    (tournament-id uint)
  )
  (map-get? user-scores {
    user: user,
    tournament-id: tournament-id,
  })
)

(define-read-only (get-user-nonce
    (user principal)
    (tournament-id uint)
  )
  (default-to u0
    (get nonce
      (map-get? user-last-nonce {
        user: user,
        tournament-id: tournament-id,
      })
    ))
)

;; Serialize uint to consensus buffer
(define-read-only (uint-to-buff (x uint))
  (unwrap-panic (to-consensus-buff? x))
)

;; Serialize principal to consensus buffer
(define-read-only (principal-to-buff (p principal))
  (unwrap-panic (to-consensus-buff? p))
)

;; Message hash now includes tournament-id:
;; sha256(DOMAIN || principal || tournament-id || score || nonce)
(define-read-only (make-message-hash
    (user principal)
    (tournament-id uint)
    (score uint)
    (nonce uint)
  )
  (let (
      (user-bytes (principal-to-buff user))
      (tournament-bytes (uint-to-buff tournament-id))
      (score-bytes (uint-to-buff score))
      (nonce-bytes (uint-to-buff nonce))
    )
    (sha256 (concat DOMAIN
      (concat user-bytes
        (concat tournament-bytes (concat score-bytes nonce-bytes))
      )))
  )
)

;; -----------------------------------------------------------------------------
;; PUBLIC FUNCTIONS
;; -----------------------------------------------------------------------------

(define-public (submit-score
    (tournament-id uint)
    (score uint)
    (nonce uint)
    (sig (buff 65))
  )
  (let (
      (user tx-sender)
      (height stacks-block-height)
      (last-nonce (get-user-nonce user tournament-id))
      (msg-hash (make-message-hash user tournament-id score nonce))
      (current-data (map-get? user-scores {
        user: user,
        tournament-id: tournament-id,
      }))
      (current-high (default-to u0 (get high-score current-data)))
      (current-total (default-to u0 (get total-score current-data)))
      (current-submissions (default-to u0 (get submissions current-data)))
    )
    ;; Validate tournament exists and is current
    (asserts! (<= tournament-id (var-get current-tournament-id))
      ERR_INVALID_TOURNAMENT
    )

    ;; Reject zero or invalid scores
    (asserts! (> score u0) ERR_BAD_SCORE)

    ;; Replay protection - nonce must be greater than last used for THIS tournament
    (asserts! (> nonce last-nonce) ERR_REPLAY_NONCE)

    ;; Verify signature
    (asserts! (secp256k1-verify msg-hash sig SERVER-PUBKEY)
      ERR_INVALID_SIG
    )

    ;; Update last nonce for this tournament
    (map-set user-last-nonce {
      user: user,
      tournament-id: tournament-id,
    } { nonce: nonce }
    )

    ;; Update scores - track high score and cumulative
    (map-set user-scores {
      user: user,
      tournament-id: tournament-id,
    } {
      high-score: (if (> score current-high)
        score
        current-high
      ),
      total-score: (+ current-total score),
      submissions: (+ current-submissions u1),
      last-nonce: nonce,
      last-height: height,
    })

    (ok {
      user: user,
      tournament-id: tournament-id,
      score: score,
      new-high-score: (> score current-high),
      total-score: (+ current-total score),
      stored-at: height,
    })
  )
)

;; -----------------------------------------------------------------------------
;; ADMIN FUNCTIONS
;; -----------------------------------------------------------------------------

(define-public (start-new-tournament)
  (let ((new-id (+ (var-get current-tournament-id) u1)))
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)

    ;; Mark previous tournament as inactive
    (map-set tournaments { tournament-id: (var-get current-tournament-id) } {
      start-height: u0,
      end-height: stacks-block-height,
      active: false,
    })

    ;; Start new tournament
    (var-set current-tournament-id new-id)
    (map-set tournaments { tournament-id: new-id } {
      start-height: stacks-block-height,
      end-height: u0,
      active: true,
    })

    (ok new-id)
  )
)
