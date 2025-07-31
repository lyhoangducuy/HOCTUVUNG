# 📘 HOCTUVUNG - Website học từ vựng thông minh

> Dự án web giúp người học quản lý, ôn luyện và phát triển vốn từ vựng.

---

## 📦 Công nghệ sử dụng

| Thành phần | Công nghệ |
|-----------|-----------|
| Backend   | Java Spring Boot (JDK 21) |
| Frontend  | ReactJS + Vite |
| Database  | MySQL (quản lý bằng MySQL Workbench) |
| API       | RESTful |
| Build tool| Maven |

---

## 🧑‍💻 Yêu cầu hệ thống

- ✅ JDK 21 trở lên  
- ✅ Node.js v22.17 trở lên  
- ✅ MySQL Server (có thể dùng XAMPP hoặc cài riêng)  
- ✅ MySQL Workbench (tùy chọn để quản lý DB)  
- ✅ Git  

---

## 🚀 Hướng dẫn cài đặt & chạy dự án

### 1. Clone source code

```bash
git clone https://github.com/lyhoangducuy/HOCTUVUNG.git
cd HOCTUVUNG
```

---

### 2. Cài đặt & chạy Backend (Spring Boot)

#### 📁 Đi vào thư mục backend
```bash
cd hoctuvung-backend
```

#### ⚙️ Tạo database MySQL
Vào MySQL Workbench, chạy lệnh SQL:

```sql
CREATE DATABASE hoctuvung CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 🛠️ Cấu hình `application.properties`

Tại `src/main/resources/application.properties`:

```properties
spring.application.name=hoctuvung
spring.datasource.url=jdbc:mysql://localhost:3306/hoctuvung
spring.datasource.username=root
spring.datasource.password=123456

spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
spring.jpa.hibernate.ddl-auto=update
```

> 🔐 Đảm bảo mật khẩu và port DB trùng khớp với cấu hình trên máy bạn.

#### ▶️ Chạy ứng dụng:
```bash
./mvnw spring-boot:run
```
Hoặc nếu đã cài Maven toàn cục:
```bash
mvn spring-boot:run
```

---

### 3. Cài đặt & chạy Frontend (ReactJS + Vite)

#### 📁 Vào thư mục frontend
```bash
cd ../hoctuvung-frontend
```

#### 📦 Cài đặt các gói:
```bash
npm install
```

#### ▶️ Chạy ứng dụng:
```bash
npm run dev
```

> Mặc định sẽ chạy ở: `http://localhost:5173`  
> Frontend sẽ gọi API tại `http://localhost:8080` — cần khớp với backend đang chạy.

---

## 🖼️ Cấu trúc thư mục

```
HOCTUVUNG/
├── hoctuvung-backend/     # Dự án Spring Boot
│   ├── src/
│   └── pom.xml
├── hoctuvung-frontend/    # Dự án React + Vite
│   ├── src/
│   └── package.json
└── README.md
```

---

## 💡 Ghi chú
- Đảm bảo backend chạy trước frontend để tránh lỗi kết nối API.
- Port có thể chỉnh trong `vite.config.js` và `application.properties`.
