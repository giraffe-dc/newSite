'use client'

import React, { useState } from 'react'
import styles from '@/styles/SurveyVote.module.css'

interface Props {
  survey?: any
  newsId?: string
}

function SurveyFreeForm({ survey, newsId }: Props) {
  const fields = (survey && survey.fields) || []
  const initial: Record<string, string> = {}
  fields.forEach((f: any) => {
    initial[f.id] = ''
  })

  const [values, setValues] = useState<Record<string, string>>(initial)
  const [submitting, setSubmitting] = useState(false)
  const [submit, setSubmit] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleChange = (id: string, v: string) => {
      setValues((s) => ({ ...s, [id]: v }))
  }

  const handleSubmit = async () => {
      if (!newsId) {
          setMessage('Missing news id')
          return
      }
      setSubmitting(true)
      setMessage(null)
      try {
          const res = await fetch('/api/survey/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ newsId, answers: values }),
          })
          if (res.ok) {
              setMessage('Дякуємо за відповідь')
          } else {
              const err = await res.json()
              setMessage(err.error || 'Помилка')
          }
      } catch (err) {
          setMessage('Помилка відправки')
      } finally {
          setSubmitting(false)
          setSubmit(true)
      }
  }

  return (
      <div className={styles.surveyVote}>
          <div className={styles.surveyHeader}>
              <h3 className={styles.question}>
                  {survey?.question || 'Анкета'}
              </h3>
              {survey?.endDate && (
                  <div className={styles.endDate}>
                      {new Date(survey.endDate) < new Date()
                          ? '⌛ Опитування завершено'
                          : '⏳ до ' +
                            new Date(survey.endDate).toLocaleDateString()}
                  </div>
              )}
          </div>

          <div className={styles.options}>
              {fields.map((f: any) => (
                  <div key={f.id} className={styles.optionItem}>
                      <label className={styles.optionText}>{f.label}</label>
                      <input
                          type="text"
                          value={values[f.id] || ''}
                          onChange={(e) => handleChange(f.id, e.target.value)}
                          className={styles.input}
                          disabled={submitting}
                      />
                  </div>
              ))}
          </div>

          <div>
              {survey?.endDate && new Date(survey.endDate) > new Date()
                  ? !submit && (
                        <button
                            className={styles.voteButton}
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <span>Відправляємо...</span>
                                    <span className={styles.spinner}>⌛</span>
                                </>
                            ) : (
                                <>
                                    <span>Зберегти відповідь</span>
                                    <span>→</span>
                                </>
                            )}
                        </button>
                    )
                  : null}
          </div>

          {message && (
              <div
                  className={`${styles.totalVotes} ${
                      message === 'Дякуємо за відповідь'
                          ? styles.success
                          : message.includes('Помилка')
                          ? styles.error
                          : ''
                  }`}
              >
                  {message}
              </div>
          )}
      </div>
  )
}

export default SurveyFreeForm
