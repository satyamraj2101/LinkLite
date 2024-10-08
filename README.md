# 🚀 LINK LITE - Your Lightweight URL Shortener 🚀

![Banner](https://img.shields.io/badge/Link-Lite-blue?style=for-the-badge&logo=appveyor)

Welcome to **LINK LITE**, a **lightweight** and **secure** URL shortening service built with **Node.js** and **PostgreSQL**. Effortlessly create, manage, and track short links with comprehensive analytics. Whether you're sharing links on social media, emails, or your website, LINK LITE ensures your URLs are concise and insightful.

![Docker Image Size](https://img.shields.io/docker/image-size/satyamraj620/linklite/latest?style=for-the-badge)
![Docker Pulls](https://img.shields.io/docker/pulls/satyamraj620/linklite?style=for-the-badge)
![License](https://img.shields.io/github/license/satyamraj620/linklite?style=for-the-badge)

---

## 📜 Table of Contents

1. [✨ Features](#-features)
2. [🛠️ Technologies Used](#️-technologies-used)
3. [🔧 Getting Started](#-getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
4. [🚀 Usage](#-usage)
5. [🐳 Docker](#docker)
    - [Building the Docker Image](#building-the-docker-image)
    - [Running with Docker](#running-with-docker)
    - [Docker Compose](#docker-compose)
6. [🌐 Deployment](#deployment)
    - [Deploying to AWS ECS with Fargate](#deploying-to-aws-ecs-with-fargate)
7. [🔒 Environment Variables](#-environment-variables)
8. [🤝 Contributing](#-contributing)
9. [📄 License](#-license)
10. [📫 Contact](#-contact)
11. [🙏 Acknowledgements](#-acknowledgements)

---

## ✨ Features

- **User Authentication**: Secure sign-up, login, and logout functionalities.
- **URL Shortening**: Generate unique and concise short links.
- **Link Management**: View, edit, and delete your shortened URLs.
- **Analytics Dashboard**: Track click statistics, including geographic and device information.
- **Secure Connections**: Supports SSL for secure database and application connections.
- **Scalable Architecture**: Designed to handle increasing traffic seamlessly.
- **Customizable Short Codes**: Option to customize your short URLs for branding.

---

## 🛠️ Technologies Used

![Node.js](https://img.shields.io/badge/-Node.js-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/-Express.js-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-blue?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/-Docker-2496ED?logo=docker&logoColor=white)
![AWS](https://img.shields.io/badge/-AWS-232F3E?logo=amazon-aws&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/-GitHub_Actions-2088FF?logo=github-actions&logoColor=white)

---

## 🔧 Getting Started

Follow these steps to get your **LINK LITE** application up and running locally.

### Prerequisites

- **Node.js** (v14 or higher) - [Download Node.js](https://nodejs.org/)
- **Docker** - [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** - Typically bundled with Docker Desktop
- **PostgreSQL** - If running locally without Docker

### Installation

1. **Clone the Repository**

    ```bash
    git clone https://github.com/satyamraj2101/linklite.git
    cd linklite
    ```

2. **Install Dependencies**

    ```bash
    npm install
    ```

3. **Configure Environment Variables**

    - Rename `.env.example` to `.env`:

        ```bash
        cp .env.example .env
        ```

    - Open `.env` and set your configuration:

        ```env
        # PostgreSQL Database Configuration
        DB_USER=avnadmin
        DB_PASSWORD=your_db_password
        DB_HOST=localhost
        DB_PORT=5432
        DB_NAME=defaultdb

        # JWT and Cookie Secrets
        JWT_SECRET=your_jwt_secret
        COOKIE_SECRET=your_cookie_secret

        # Application Domain
        DOMAIN=yourdomain.com

        # SSL Certificate for Database Connection (if applicable)
        DB_SSL_CA=/path/to/ca.crt

        # Node Environment
        NODE_ENV=development
        ```

4. **Start the Application**

    ```bash
    npm start
    ```

    The application should now be running at `http://localhost:3000`.

---

## 🚀 Usage

1. **Access the Application**

    Open your browser and navigate to `http://localhost:3000`.

2. **Create an Account**

    - Sign up with your email and password.
    - Verify your email if email verification is enabled.

3. **Shorten a URL**

    - After logging in, navigate to the dashboard.
    - Enter the long URL you wish to shorten.
    - Optionally, customize the short code.
    - Click **"Shorten"** to generate your short URL.

4. **Manage Links**

    - View all your shortened URLs.
    - Edit or delete links as needed.
    - Access analytics for each link to monitor performance.

---

## 🐳 Docker

Containerize your application for consistent environments and easier deployments.

### Building the Docker Image

Ensure Docker is installed and running on your machine.

```bash
docker build -t satyamraj620/linklite:latest .
