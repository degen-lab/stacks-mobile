(define-private (send-stx (recipient {
  to: principal,
  ustx: uint,
  memo: (buff 34)
}))
  (stx-transfer-memo? (get ustx recipient) tx-sender (get to recipient) (get memo recipient))
)

(define-private (check-err
    (result (response bool uint))
    (prior (response bool uint))
  )
  (match prior
    ok-value result
    err-value (err err-value)
  )
)

(define-public (send-many (recipients (list 200 {
  to: principal,
  ustx: uint,
  memo: (buff 34)
})))
  (fold check-err (map send-stx recipients) (ok true))
)