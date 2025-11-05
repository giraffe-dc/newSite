'use client'

import React, { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import styles from '@/styles/admin/AdminSurveyResponses.module.css'

interface SurveyResponse {
    _id: string
    newsId: string
    newsTitle: string
    surveyQuestion: string
    surveyFields: Array<{ id: string; label: string }>
    answers: Record<string, string>
    createdAt: string
}

export default function Survey() {
    const [responses, setResponses] = useState<SurveyResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedNewsId, setSelectedNewsId] = useState<string>('')

    // Get unique news items from responses for filter
    const newsItems = [
        ...new Set(
            responses.map((r) => ({ id: r.newsId, title: r.newsTitle }))
        ),
    ].filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i)

    useEffect(() => {
        fetchResponses()
    }, [])

    const fetchResponses = async (newsId?: string) => {
        try {
            setLoading(true)
            const url = `/api/admin/survey/responses${
                newsId ? `?newsId=${newsId}` : ''
            }`
            const res = await fetch(url)

            if (!res.ok) {
                throw new Error('Failed to fetch responses')
            }

            const data = await res.json()
            setResponses(data)
            setError('')
        } catch (err) {
            console.error('Error fetching responses:', err)
            setError('Помилка завантаження відповідей')
        } finally {
            setLoading(false)
        }
    }

    const handleNewsFilter = (newsId: string) => {
        setSelectedNewsId(newsId)
        fetchResponses(newsId || undefined)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const handleExportToExcel = () => {
        // Підготовка даних для Excel
        const excelData = responses.map((response) => ({
            Новина: response.newsTitle,
            Питання: response.surveyQuestion,
            'Дата відповіді': formatDate(response.createdAt),
            ...response.surveyFields.reduce(
                (acc, field) => ({
                    ...acc,
                    [field.label]: response.answers[field.id] || '—',
                }),
                {}
            ),
        }))

        // Створення робочої книги Excel
        const worksheet = XLSX.utils.json_to_sheet(excelData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Відповіді')

        // Зберігання файлу
        const fileName = `survey-responses-${
            new Date().toISOString().split('T')[0]
        }.xlsx`
        XLSX.writeFile(workbook, fileName)
    }

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}>⌛</div>
                <p>Завантаження відповідей...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className={styles.error}>
                <p>{error}</p>
                <button
                    onClick={() => fetchResponses()}
                    className={styles.retryButton}
                >
                    Спробувати знову
                </button>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleContainer}>
                    <h1 className={styles.title}>Відповіді на опитування</h1>
                    <button
                        onClick={handleExportToExcel}
                        className={styles.exportButton}
                        disabled={responses.length === 0}
                    >
                        📥 Експорт в Excel
                    </button>
                </div>

                <div className={styles.filter}>
                    <select
                        value={selectedNewsId}
                        onChange={(e) => handleNewsFilter(e.target.value)}
                        className={styles.select}
                    >
                        <option value="">Всі новини</option>
                        {newsItems.map((news) => (
                            <option key={news.id} value={news.id}>
                                {news.title}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {responses.length === 0 ? (
                <div className={styles.empty}>
                    <p>Відповідей ще немає</p>
                </div>
            ) : (
                <div className={styles.responsesGrid}>
                    {responses.map((response) => (
                        <div key={response._id} className={styles.responseCard}>
                            <div className={styles.responseHeader}>
                                <h3>{response.newsTitle}</h3>
                                <time>{formatDate(response.createdAt)}</time>
                            </div>

                            {response.surveyQuestion && (
                                <div className={styles.questionSection}>
                                    <p className={styles.question}>
                                        {response.surveyQuestion}
                                    </p>
                                </div>
                            )}

                            <div className={styles.answers}>
                                {response.surveyFields.map((field) => (
                                    <div
                                        key={field.id}
                                        className={styles.answerRow}
                                    >
                                        <span className={styles.label}>
                                            {field.label}:
                                        </span>
                                        <span className={styles.value}>
                                            {response.answers[field.id] || '—'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}