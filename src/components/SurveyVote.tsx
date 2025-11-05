
"use client"

import React, { useEffect, useState } from 'react'
import { Survey } from '@/types'
import styles from '@/styles/SurveyVote.module.css'

interface SurveyVoteProps {
    survey: Survey
    onVote?: (optionIds: string[]) => void
    showResults?: boolean
    // optional externally provided results (news modal can fetch after vote)
    results?: Record<string, number>
    totalVotes?: number
}

export const SurveyVote: React.FC<SurveyVoteProps> = ({
    survey,
    onVote,
    showResults = false,
    results: propResults,
    totalVotes: propTotalVotes,
}) => {
    const [selectedOptions, setSelectedOptions] = useState<string[]>([])
    const [hasVoted, setHasVoted] = useState(false)
    const [totalVotes, setTotalVotes] = useState<number>(propTotalVotes || 0)
    const [results, setResults] = useState<Record<string, number>>(propResults || {})

    useEffect(() => {
        if (propResults) setResults(propResults)
    }, [propResults])

    useEffect(() => {
        if (typeof propTotalVotes === 'number') setTotalVotes(propTotalVotes)
    }, [propTotalVotes])

    const handleOptionClick = (optionId: string) => {
        if (hasVoted) return

        if (survey.allowMultiple) {
            setSelectedOptions((prev) =>
                prev.includes(optionId)
                    ? prev.filter((id) => id !== optionId)
                    : [...prev, optionId]
            )
        } else {
            setSelectedOptions([optionId])
        }
    }

    const handleVote = () => {
        if (selectedOptions.length === 0) return
        onVote?.(selectedOptions)
        setHasVoted(true)
    }

    const getPercentage = (optionId: string) => {
        const t = totalVotes || 0
        if (!results || t === 0) return 0
        return ((results[optionId] || 0) / t) * 100
    }

    const isExpired = survey.endDate
        ? new Date(survey.endDate) < new Date()
        : false

    return (
        <div className={styles.surveyVote}>
            <div className={styles.surveyHeader}>
                <h3 className={styles.question}>{survey.question}</h3>
                {survey.endDate && (
                    <div className={styles.endDate}>
                        {isExpired 
                            ? '⌛ Опитування завершено' 
                            : '⏳ до ' + new Date(survey.endDate).toLocaleDateString()
                        }
                    </div>
                )}
            </div>

            <div className={styles.options}>
                {survey.options.map((option) => (
                    <button
                        key={option.id}
                        className={`${styles.option} ${
                            selectedOptions.includes(option.id)
                                ? styles.selected
                                : ''
                        } ${hasVoted || showResults ? styles.voted : ''}`}
                        onClick={() => handleOptionClick(option.id)}
                        disabled={hasVoted || showResults || isExpired}
                    >
                        <div className={styles.optionContent}>
                            <span className={styles.optionText}>
                                {option.text}
                            </span>
                            {(hasVoted || showResults) && (
                                <span className={styles.percentage}>
                                    {Math.round(getPercentage(option.id))}%
                                </span>
                            )}
                        </div>
                        {(hasVoted || showResults) && (
                            <div
                                className={styles.progressBar}
                                style={{
                                    width: `${getPercentage(option.id)}%`,
                                }}
                            />
                        )}
                    </button>
                ))}
            </div>

            {!hasVoted && !showResults && !isExpired && (
                <button
                    className={styles.voteButton}
                    onClick={handleVote}
                    disabled={selectedOptions.length === 0}
                >
                    Проголосувати
                </button>
            )}

            {(hasVoted || showResults) && (
                <div className={styles.totalVotes}>
                    Всього голосів: {totalVotes}
                </div>
            )}
        </div>
    )
}

export default SurveyVote