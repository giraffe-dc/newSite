'use client'

import React, { useState } from 'react'
import styles from '@/styles/NewsModal.module.css'
import PhotoSlider from './PhotoSlider'

import { Survey } from '@/types'
import { SurveyVote } from './SurveyVote'
import SurveyFreeForm from './SurveyFreeForm'

interface NewsModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    content: string
    date: string
    type: 'news' | 'event'
    images: string[]
    survey?: Survey
    newsId?: string
}

const NewsModal: React.FC<NewsModalProps> = ({
    isOpen,
    onClose,
    title,
    content,
    date,
    type,
    images,
    survey,
    newsId,
}) => {
    const [showResults, setShowResults] = useState(false)
    const [results, setResults] = useState<Record<string, number> | undefined>(
        undefined
    )
    const [totalVotes, setTotalVotes] = useState<number | undefined>(undefined)
    if (!isOpen) return null

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('uk-UA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

    const getTypeIcon = (type: string) => {
        return type === 'event' ? '🎉' : '📰'
    }

    const getTypeLabel = (type: string) => {
        return type === 'event' ? 'Подія' : 'Новина'
    }

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div
                className={styles.modalContent}
                onClick={(e) => e.stopPropagation()}
            >
                <button className={styles.closeButton} onClick={onClose}>
                    ×
                </button>

                <div className={styles.modalHeader}>
                    <div className={styles.typeBadge}>
                        <span className={styles.badgeIcon}>
                            {getTypeIcon(type)}
                        </span>
                        <span className={styles.badgeText}>
                            {getTypeLabel(type)}
                        </span>
                    </div>
                    <div className={styles.dateInfo}>
                        <span className={styles.dateIcon}>📅</span>
                        <span className={styles.dateText}>
                            {formatDate(date)}
                        </span>
                    </div>
                </div>

                <h2 className={styles.modalTitle}>{title}</h2>

                {images.length > 0 && (
                    <div className={styles.sliderContainer}>
                        <PhotoSlider photos={images} />
                    </div>
                )}

                <div className={styles.modalBody}>
                    {content.split('\n').map((paragraph, index) => (
                        <p key={index} className={styles.paragraph}>
                            {paragraph}
                        </p>
                    ))}

                    {survey && (
                        <div className={styles.surveySection}>
                            {survey.fields && survey.fields.length > 0 ? (
                                <SurveyFreeForm
                                    survey={survey}
                                    newsId={newsId}
                                />
                            ) : (
                                <SurveyVote
                                    survey={survey}
                                    showResults={showResults}
                                    results={results}
                                    totalVotes={totalVotes}
                                    onVote={async (optionIds: string[]) => {
                                        try {
                                            if (!newsId) {
                                                console.error(
                                                    'Missing newsId for survey vote'
                                                )
                                                return
                                            }

                                            const res = await fetch(
                                                '/api/survey/vote',
                                                {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type':
                                                            'application/json',
                                                    },
                                                    body: JSON.stringify({
                                                        newsId,
                                                        optionIds,
                                                    }),
                                                }
                                            )
                                            if (!res.ok) {
                                                const error = await res.json()
                                                console.error(
                                                    'Vote failed',
                                                    error
                                                )
                                                return
                                            }

                                            // fetch results
                                            const r = await fetch(
                                                `/api/survey/results?newsId=${encodeURIComponent(
                                                    newsId
                                                )}`
                                            )
                                            if (r.ok) {
                                                const data = await r.json()
                                                setResults(
                                                    data.optionResults || {}
                                                )
                                                setTotalVotes(
                                                    data.totalVotes || 0
                                                )
                                                setShowResults(true)
                                            }
                                        } catch (err) {
                                            console.error(
                                                'Error submitting vote:',
                                                err
                                            )
                                        }
                                    }}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default NewsModal