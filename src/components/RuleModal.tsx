'use client'
import React from 'react'
import styles from '@/styles/RuleModal.module.css'

interface RuleModalProps {
  rule: {
    title: string
    fullDescription: string[]
  }
  onClose: () => void
}

const RuleModal: React.FC<RuleModalProps> = ({ rule, onClose }) => {
  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{rule.title}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </div>
        <div className={styles.modalBody}>
          <ul>
            {rule.fullDescription.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default RuleModal
