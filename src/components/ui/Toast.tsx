'use client'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle } from 'lucide-react'
import styles from '@/styles/Toast.module.css'

interface ToastProps {
    message: string
    type: 'success' | 'error'
    visible: boolean
    onHide: () => void
    duration?: number
}

export default function Toast({ message, type, visible, onHide, duration = 4000 }: ToastProps) {
    useEffect(() => {
        if (!visible) return
        const timer = setTimeout(onHide, duration)
        return () => clearTimeout(timer)
    }, [visible, onHide, duration])

    return (
        <AnimatePresence>
            {visible && (
                <div className={styles.toastWrapper}>
                    <motion.div
                        className={`${styles.toast} ${type === 'success' ? styles.success : styles.error}`}
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    >
                        {type === 'success'
                            ? <CheckCircle className={styles.icon} />
                            : <XCircle className={styles.icon} />
                        }
                        {message}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
