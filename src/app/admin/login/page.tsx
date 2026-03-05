"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/styles/admin/AdminLogin.module.css";

const AdminLoginPage = () => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        router.push("/admin");
      } else {
        const data = await response.json();
        setError(data.error || "Помилка входу");
      }
    } catch (error) {
      setError("Помилка підключення до сервера");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <div className={styles.logoContainer}>
              <span className={styles.logoIcon}>🦒</span>
              <h1 className={styles.logoTitle}>Жирафик</h1>
            </div>
            <h2 className={styles.loginTitle}>Адмін панель</h2>
            <p className={styles.loginSubtitle}>
              Увійдіть для керування сайтом
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.loginForm}>
            {error && (
              <div className={styles.errorMessage}>
                <span className={styles.errorIcon}>⚠️</span>
                {error}
              </div>
            )}

            <div className={styles.inputGroup}>
              <label htmlFor="username" className={styles.inputLabel}>
                👤 Ім'я користувача
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={credentials.username}
                onChange={handleInputChange}
                required
                className={styles.input}
                placeholder="Введіть ім'я користувача"
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.inputLabel}>
                🔐 Пароль
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={credentials.password}
                onChange={handleInputChange}
                required
                className={styles.input}
                placeholder="Введіть пароль"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={styles.loginButton}
            >
              {loading ? (
                <>
                  <span className={styles.spinner}>⏳</span>
                  Вхід...
                </>
              ) : (
                <>🚀 Увійти</>
              )}
            </button>
          </form>

          <div className={styles.loginFooter}>
            <p className={styles.footerText}>
              🔒 Безпечний вхід до системи управління
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
