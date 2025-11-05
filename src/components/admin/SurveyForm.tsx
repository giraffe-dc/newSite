'use client'

import React, { useState } from 'react'
import styles from '@/styles/admin/AdminNews.module.css'
import { Survey, SurveyField } from '@/types'

interface SurveyFormProps {
    survey?: Survey
    onChange: (survey: Survey) => void
    onValidityChange?: (valid: boolean) => void
    onRemove: () => void
}

export const SurveyForm: React.FC<SurveyFormProps> = ({
    survey,
    onChange,
    onValidityChange,
    onRemove,
}) => {
    const [question, setQuestion] = useState(survey?.question || '')
    const [fields, setFields] = useState<SurveyField[]>(
        survey?.fields || [{ id: '1', label: '' }]
    )
    const [endDate, setEndDate] = useState(
        survey?.endDate || new Date().toISOString().split('T')[0]
    )
    const handleFieldChange = (id: string, label: string) => {
        const newFields = fields.map((f) => (f.id === id ? { ...f, label } : f))
        setFields(newFields)
        updateSurvey(question, newFields, endDate)
    }

    const addField = () => {
        const newFields = [...fields, { id: (fields.length + 1).toString(), label: '' }]
        setFields(newFields)
        updateSurvey(question, newFields, endDate)
    }

    const removeField = (id: string) => {
        if (fields.length <= 1) {
            alert('Опитування повинно мати хоча б 1 поле')
            return
        }
        const newFields = fields.filter((f) => f.id !== id)
        setFields(newFields)
        updateSurvey(question, newFields, endDate)
    }

    const updateSurvey = (question: string, fields: SurveyField[], endDate: string) => {
        const valid = fields.length >= 1 && !fields.some((f) => !f.label.trim())

        const surveyObj: Survey = {
            // keep question for backward compatibility; optional
            question,
            options: survey?.options || [],
            endDate,
            fields,
        }

        onChange(surveyObj)
        onValidityChange?.(!!valid)
    }

    return (
        <div className={styles.surveyForm}>
            <div className={styles.surveyHeader}>
                <h3 className={styles.surveyTitle}>Опитування</h3>
                <button
                    type="button"
                    onClick={onRemove}
                    className={styles.removeSurveyBtn}
                >
                    ❌ Видалити опитування
                </button>
            </div>

            <div className={styles.surveyContent}>
                <div className={styles.optionsSection}>
                    <label className={styles.inputLabel}>Поля форми опитування</label>
                    {fields.map((field) => (
                        <div key={field.id} className={styles.optionItem}>
                            <input
                                type="text"
                                value={field.label}
                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                className={styles.input}
                                placeholder={`Підпис поля ${field.id}`}
                            />
                            <button
                                type="button"
                                onClick={() => removeField(field.id)}
                                className={styles.removeOptionBtn}
                            >
                                ❌
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={addField} className={styles.addOptionBtn}>
                        + Додати поле
                    </button>
                </div>

                <div className={styles.surveySettings}>
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>
                            Дата закінчення опитування
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value)
                                updateSurvey(
                                    question,
                                    fields,
                                    e.target.value
                                )
                            }}
                            className={styles.input}
                            min={new Date().toISOString().split('T')[0]}
                            required
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SurveyForm