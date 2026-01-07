;; =============================================================================
;; GAME SCORE CONTRACT
;; =============================================================================
;;
;; Secure score submission with server-side signature verification.
;;
;; FLOW:
;;   1. User plays game, backend records score
;;   2. Backend signs: sha256(DOMAIN || user || score || nonce) with server private key
;;   3. User submits (score, nonce, signature) to this contract
;;   4. Contract verifies signature matches SERVER-PUBKEY
;;   5. Score is stored on-chain
;;
;; SECURITY:
;;   - Nonce prevents replay attacks (must be > last used nonce)
;;   - Signature ensures only server-approved scores are accepted
;;   - User principal is included in hash to prevent cross-user attacks
;;
;; =============================================================================

(define-constant ERR_INVALID_SIG (err u100))
(define-constant ERR_REPLAY_NONCE (err u101))
(define-constant ERR_BAD_SCORE (err u102))

(define-constant DOMAIN 0x47414d452d5631) ;; "GAME-V1"

;; Backend public key (33 bytes compressed secp256k1)
(define-constant SERVER-PUBKEY 0x0216f4507093a2222385a1a55ad48f9ee3a398bc8fe3ef42dcd06a81e82c1fb900)

(define-map user-last-nonce
  { user: principal }
  { nonce: uint }
)

(define-map user-scores
  { user: principal }
  {
    score: uint,
    nonce: uint,
    height: uint,
  }
)

;; Serialize uint to consensus buffer (16 bytes for uint)
(define-read-only (uint-to-buff (x uint))
  (unwrap-panic (to-consensus-buff? x))
)

;; Serialize principal to consensus buffer
(define-read-only (principal-to-buff (p principal))
  (unwrap-panic (to-consensus-buff? p))
)

;; Final message:
;; sha256(DOMAIN || principal || score || nonce)
(define-read-only (make-message-hash
    (user principal)
    (score uint)
    (nonce uint)
  )
  (let (
      (u-bytes (principal-to-buff user))
      (score-bytes (uint-to-buff score))
      (nonce-bytes (uint-to-buff nonce))
    )
    (sha256 (concat DOMAIN (concat u-bytes (concat score-bytes nonce-bytes))))
  )
)

(define-public (submit-score
    (score uint)
    (nonce uint)
    (sig (buff 65))
  )
  (let (
      (user tx-sender)
      (height stacks-block-height)
      (last-nonce (default-to u0
        (get nonce (map-get? user-last-nonce { user: user }))
      ))
      (msg-hash (make-message-hash tx-sender score nonce))
    )
    ;; reject zero or invalid scores
    (asserts! (> score u0) ERR_BAD_SCORE)

    ;; replay protection - nonce must be greater than last used
    (asserts! (> nonce last-nonce) ERR_REPLAY_NONCE)

    ;; verify signature
    (asserts! (secp256k1-verify msg-hash sig SERVER-PUBKEY)
      ERR_INVALID_SIG
    )

    ;; update last nonce
    (map-set user-last-nonce { user: user } { nonce: nonce })

    ;; save score
    (map-set user-scores { user: user } {
      score: score,
      nonce: nonce,
      height: height,
    })

    (ok {
      user: user,
      score: score,
      stored-at: height,
    })
  )
)
