# 🚀 Quick Start - MS1 Customer Service

## Inicio Rápido para Desarrollo

### Opción 1: Docker Compose (Más Rápido) ⚡

```powershell
# 1. Clonar y navegar
git clone <repository-url>
cd cloud-computing-project-ms-1

# 2. Iniciar todo el entorno
docker-compose --profile simulators --profile admin up -d

# 3. Verificar servicios
docker-compose ps

# 4. Health check
curl http://localhost:3000/health

# 5. Ver logs
docker-compose logs -f ms1-customer-service
```

**Servicios disponibles:**
- 🏦 MS1 Customer Service: http://localhost:3000
- 🍃 MongoDB: localhost:27017
- 🎛️ Mongo Express (Admin): http://localhost:8081
- 🔧 MS2 Simulator: http://localhost:3001
- ✅ MS4 Simulator: http://localhost:3003

### Opción 2: Desarrollo Local 💻

```powershell
# 1. Instalar dependencias
npm install

# 2. Configurar entorno
copy .env.example .env
# Editar .env si necesitas cambios

# 3. Iniciar MongoDB
# Instalar desde: https://www.mongodb.com/try/download/community
mongod --dbpath C:\data\db

# 4. Compilar TypeScript
npm run build

# 5. Modo desarrollo (con watch)
npm run dev

# O modo producción
npm start
```

## ⚡ Test Rápido de Funcionalidad

```powershell
# 1. Health Check
curl http://localhost:3000/health

# 2. Crear cliente
curl -X POST http://localhost:3000/api/customers `
  -H "Content-Type: application/json" `
  -d '{
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan.perez@test.com",
    "phone": "+57 300 123 4567",
    "dateOfBirth": "1990-05-15",
    "nationalId": "1234567890",
    "address": {
      "street": "Calle 123 #45-67",
      "city": "Bogotá",
      "state": "Cundinamarca",
      "postalCode": "110001",
      "country": "Colombia"
    }
  }'

# 3. Obtener cliente (usa el ID de la respuesta anterior)
curl http://localhost:3000/api/customers/{CUSTOMER_ID}

# 4. Obtener cuentas del cliente
curl http://localhost:3000/api/customers/{CUSTOMER_ID}/accounts
```

## 🔧 Comandos Útiles

```powershell
# Ver logs en tiempo real
docker-compose logs -f ms1-customer-service

# Reiniciar solo MS1
docker-compose restart ms1-customer-service

# Ver todos los servicios
docker-compose ps

# Parar todo
docker-compose down

# Parar y limpiar volúmenes
docker-compose down -v

# Rebuild e iniciar
docker-compose up --build -d

# Acceder al contenedor
docker-compose exec ms1-customer-service sh
```

## 📊 Monitoreo Rápido

```powershell
# Estado de servicios
curl http://localhost:3000/health

# Listar clientes
curl "http://localhost:3000/api/customers?page=1&limit=5"

# Buscar clientes
curl "http://localhost:3000/api/customers?q=Juan"

# Verificar base de datos (MongoDB)
# Abrir http://localhost:8081 en navegador
# Usuario: admin, Password: password
```

## 🚀 Para Producción

```powershell
# Build imagen optimizada
docker build -t ms1-customer-service:prod .

# Ejecutar en producción
docker run -d `
  --name ms1-prod `
  -p 3000:3000 `
  -e NODE_ENV=production `
  -e MONGODB_URI=mongodb://prod-mongo:27017/customer_service_db `
  ms1-customer-service:prod
```

## 📚 Documentación

- 📖 [README.md](./README.md) - Documentación completa
- 🧪 [TESTING.md](./TESTING.md) - Guía de testing
- 🏗️ [Architecture](#arquitectura) - Diagrama de arquitectura
- 📡 [API Endpoints](#api-endpoints) - Lista de endpoints

## 🆘 Solución de Problemas

### Error: Puerto ocupado
```powershell
# Verificar qué usa el puerto 3000
netstat -ano | findstr :3000

# Matar proceso si es necesario
taskkill /PID {PID} /F
```

### Error: MongoDB no conecta
```powershell
# Verificar MongoDB
docker-compose logs mongodb

# Reiniciar MongoDB
docker-compose restart mongodb
```

### Error: Build de TypeScript
```powershell
# Limpiar y recompilar
npm run clean
npm install
npm run build
```

---

**¡Listo para desarrollar! 🎉**

El microservicio MS1 está completamente configurado y listo para el entregable de la semana 7. Todos los endpoints, validaciones, integraciones y documentación están implementados según los requisitos del proyecto.