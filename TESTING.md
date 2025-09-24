# 🧪 Testing Guide - MS1 Customer Service

## Guía Completa de Testing para el Entregable de la Semana 7

Esta guía proporciona todos los pasos necesarios para probar el microservicio MS1 Customer Service y verificar que cumple con todos los requisitos del proyecto.

## 🚀 Inicio Rápido

### Opción 1: Usando Docker Compose (Recomendado)

```powershell
# Iniciar todos los servicios
docker-compose --profile simulators up -d

# Verificar que todos los servicios están corriendo
docker-compose ps
```

### Opción 2: Instalación Local

```powershell
# 1. Iniciar MongoDB
# Instalar MongoDB Community: https://www.mongodb.com/try/download/community

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
copy .env.example .env
# Editar .env si es necesario

# 4. Compilar y ejecutar
npm run build
npm start
```

## ✅ Verificaciones Iniciales

### 1. Health Check del Servicio

```powershell
# Verificar que el servicio está funcionando
curl http://localhost:3000/health
```

**Respuesta esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "version": "1.0.0",
  "database": {
    "status": "connected",
    "name": "customer_service_db"
  },
  "externalServices": {
    "ms2": "available",
    "ms4": "available"
  }
}
```

### 2. Información del Servicio

```powershell
curl http://localhost:3000/
```

**Respuesta esperada:**
```json
{
  "service": "MS1 - Customer Service",
  "version": "1.0.0",
  "description": "Microservicio para gestión de clientes",
  "endpoints": {
    "health": "/health",
    "customers": "/api/customers",
    "docs": "/api-docs"
  }
}
```

## 📋 Tests de Funcionalidad Principal

### Test 1: Registro de Cliente (POST /customers)

**Requisito**: Customer registration (POST /customers)

```powershell
curl -X POST http://localhost:3000/api/customers `
  -H "Content-Type: application/json" `
  -d '{
    "firstName": "María",
    "lastName": "González",
    "email": "maria.gonzalez@test.com",
    "phone": "+57 300 123 4567",
    "dateOfBirth": "1992-08-20",
    "nationalId": "1234567890",
    "address": {
      "street": "Carrera 15 #85-30",
      "city": "Bogotá",
      "state": "Cundinamarca",
      "postalCode": "110221",
      "country": "Colombia"
    },
    "preferences": {
      "language": "es",
      "currency": "COP",
      "notificationPreferences": {
        "email": true,
        "sms": false,
        "push": true
      },
      "marketingConsent": true
    }
  }'
```

**Validaciones esperadas:**
- ✅ Status Code: 201 Created
- ✅ Respuesta incluye ID generado
- ✅ Timestamp de creación
- ✅ Status "active"
- ✅ complianceStatus "pending" (MS4 trigger)

### Test 2: Validación de Unicidad

**Requisito**: Validate uniqueness

```powershell
# Intentar registrar el mismo email
curl -X POST http://localhost:3000/api/customers `
  -H "Content-Type: application/json" `
  -d '{
    "firstName": "Pedro",
    "lastName": "Ramírez",
    "email": "maria.gonzalez@test.com",
    "phone": "+57 300 555 1234",
    "dateOfBirth": "1988-03-15",
    "nationalId": "9876543210",
    "address": {
      "street": "Calle 26 #47-11",
      "city": "Medellín",
      "state": "Antioquia",
      "postalCode": "050001",
      "country": "Colombia"
    }
  }'
```

**Validaciones esperadas:**
- ✅ Status Code: 409 Conflict
- ✅ Error message sobre email duplicado

### Test 3: Obtener Detalles de Cliente (GET /customers/{id})

**Requisito**: Retrieve customer details (GET /customers/{id})

```powershell
# Usar el ID del cliente creado en Test 1
curl http://localhost:3000/api/customers/{CUSTOMER_ID}
```

**Validaciones esperadas:**
- ✅ Status Code: 200 OK
- ✅ Todos los campos del cliente
- ✅ No exposición de campos sensibles internos
- ✅ Información de auditoría (createdAt, updatedAt)

### Test 4: Actualización de Perfil (PUT /customers/{id})

**Requisito**: Profile management (PUT /customers/{id})

```powershell
curl -X PUT http://localhost:3000/api/customers/{CUSTOMER_ID} `
  -H "Content-Type: application/json" `
  -d '{
    "phone": "+57 300 999 8888",
    "address": {
      "street": "Nueva Dirección #123-45",
      "city": "Cali",
      "state": "Valle del Cauca",
      "postalCode": "760001",
      "country": "Colombia"
    },
    "preferences": {
      "language": "en",
      "currency": "USD",
      "notificationPreferences": {
        "email": false,
        "sms": true,
        "push": true
      },
      "marketingConsent": false
    }
  }'
```

**Validaciones esperadas:**
- ✅ Status Code: 200 OK
- ✅ Campos actualizados correctamente
- ✅ updatedAt actualizado

### Test 5: Vinculación con Cuentas (GET /customers/{id}/accounts)

**Requisito**: Link customer to accounts (GET /customers/{id}/accounts)

```powershell
curl http://localhost:3000/api/customers/{CUSTOMER_ID}/accounts
```

**Validaciones esperadas:**
- ✅ Status Code: 200 OK
- ✅ Integración exitosa con MS2
- ✅ Lista de cuentas del cliente
- ✅ Manejo correcto si MS2 no está disponible

## 📄 Tests de Documentos KYC

### Test 6: Almacenamiento Flexible de Documentos

**Requisito**: Store flexible documents (KYC)

```powershell
curl -X POST http://localhost:3000/api/customers/{CUSTOMER_ID}/documents `
  -H "Content-Type: application/json" `
  -d '{
    "documentType": "passport",
    "documentNumber": "AB123456",
    "issuedBy": "Colombia",
    "issuedDate": "2020-01-15",
    "expiryDate": "2030-01-15",
    "documentData": {
      "frontImageUrl": "https://example.com/passport-front.jpg",
      "backImageUrl": "https://example.com/passport-back.jpg",
      "pdfUrl": "https://example.com/passport.pdf"
    }
  }'
```

**Validaciones esperadas:**
- ✅ Status Code: 200 OK
- ✅ Documento agregado al array KYC
- ✅ Status "uploaded" asignado
- ✅ Timestamp de carga

## 🔄 Tests de Integración

### Test 7: Trigger de Compliance (MS4)

**Requisito**: Trigger compliance checks in MS4

Verificar en los logs que se active la integración con MS4:

```powershell
# En Docker
docker-compose logs -f ms1-customer-service

# Buscar logs como:
# "Triggering compliance check for customer: {customerId}"
# "Compliance check initiated successfully"
```

**Validaciones esperadas:**
- ✅ Request enviado a MS4 tras registro
- ✅ complianceStatus del cliente actualizado
- ✅ Logging de la integración

### Test 8: Búsqueda y Filtrado

**Requisito**: Búsqueda avanzada de clientes

```powershell
# Búsqueda por nombre
curl "http://localhost:3000/api/customers?q=María&page=1&limit=10"

# Filtro por país
curl "http://localhost:3000/api/customers?country=Colombia"

# Filtro por estado de compliance
curl "http://localhost:3000/api/customers?complianceStatus=pending"

# Combinando filtros
curl "http://localhost:3000/api/customers?status=active&country=Colombia&page=1&limit=5"
```

**Validaciones esperadas:**
- ✅ Resultados filtrados correctamente
- ✅ Paginación funcionando
- ✅ Metadatos de paginación incluidos

## 🔒 Tests de Seguridad

### Test 9: Rate Limiting

```powershell
# Hacer múltiples requests rápidos para activar rate limiting
for ($i=1; $i -le 105; $i++) {
    curl http://localhost:3000/health
    Write-Host "Request $i"
}
```

**Validaciones esperadas:**
- ✅ Status Code: 429 Too Many Requests después del límite
- ✅ Header "Retry-After" incluido

### Test 10: Validación de Input

```powershell
# Input inválido - email malformado
curl -X POST http://localhost:3000/api/customers `
  -H "Content-Type: application/json" `
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "invalid-email",
    "phone": "invalid-phone",
    "dateOfBirth": "invalid-date",
    "nationalId": ""
  }'
```

**Validaciones esperadas:**
- ✅ Status Code: 400 Bad Request
- ✅ Errores de validación detallados
- ✅ No información sensible expuesta

### Test 11: Input Sanitization

```powershell
# Intentar XSS
curl -X POST http://localhost:3000/api/customers `
  -H "Content-Type: application/json" `
  -d '{
    "firstName": "<script>alert(\"xss\")</script>",
    "lastName": "Test",
    "email": "xss@test.com",
    "phone": "+57 300 123 4567",
    "dateOfBirth": "1990-01-01",
    "nationalId": "1111111111"
  }'
```

**Validaciones esperadas:**
- ✅ Script tags removidos o escapados
- ✅ Datos sanitizados en respuesta

## 💾 Tests de Base de Datos

### Test 12: Conexión a MongoDB

```powershell
# Verificar conexión
curl http://localhost:3000/health
```

Verificar en la respuesta que database.status sea "connected".

### Test 13: Persistencia de Datos

```powershell
# 1. Crear cliente
curl -X POST http://localhost:3000/api/customers `
  -H "Content-Type: application/json" `
  -d '{...datos del cliente...}'

# 2. Reiniciar servicio
docker-compose restart ms1-customer-service

# 3. Verificar que el cliente sigue existiendo
curl http://localhost:3000/api/customers/{CUSTOMER_ID}
```

**Validaciones esperadas:**
- ✅ Datos persisten tras reinicio
- ✅ Integridad de datos mantenida

## 📊 Tests de Performance

### Test 14: Tiempo de Respuesta

```powershell
# Usar Invoke-WebRequest para medir tiempo
Measure-Command {
    Invoke-WebRequest -Uri "http://localhost:3000/api/customers/{CUSTOMER_ID}" -Method Get
}
```

**Validaciones esperadas:**
- ✅ Respuesta < 200ms para operaciones CRUD
- ✅ Health check < 50ms

### Test 15: Concurrencia

```powershell
# Ejecutar múltiples requests en paralelo
$jobs = @()
for ($i=1; $i -le 10; $i++) {
    $jobs += Start-Job -ScriptBlock {
        curl "http://localhost:3000/api/customers?page=1&limit=10"
    }
}
$jobs | Wait-Job | Receive-Job
```

**Validaciones esperadas:**
- ✅ Todas las requests se procesan correctamente
- ✅ No errores de concurrencia

## 🐛 Tests de Manejo de Errores

### Test 16: Cliente No Encontrado

```powershell
curl http://localhost:3000/api/customers/507f1f77bcf86cd799439011
```

**Validaciones esperadas:**
- ✅ Status Code: 404 Not Found
- ✅ Mensaje de error apropiado

### Test 17: ID Inválido

```powershell
curl http://localhost:3000/api/customers/invalid-id
```

**Validaciones esperadas:**
- ✅ Status Code: 400 Bad Request
- ✅ Error de ID malformado

### Test 18: Servicios Externos No Disponibles

```powershell
# Detener simuladores
docker-compose stop ms2-simulator ms4-simulator

# Intentar obtener cuentas
curl http://localhost:3000/api/customers/{CUSTOMER_ID}/accounts
```

**Validaciones esperadas:**
- ✅ Status Code: 503 Service Unavailable O manejo graceful
- ✅ Mensaje indicando servicio no disponible
- ✅ Servicio principal sigue funcionando

## 📋 Checklist de Entrega

### ✅ Requisitos Funcionales Cumplidos

- [ ] **Customer registration (POST /customers)**: Cliente puede ser registrado
- [ ] **Profile management (PUT /customers/{id})**: Perfil puede ser actualizado
- [ ] **Retrieve customer details (GET /customers/{id})**: Detalles se obtienen correctamente
- [ ] **Link customer to accounts (GET /customers/{id}/accounts)**: Integración con MS2 funciona
- [ ] **Validate uniqueness**: Email y nationalId únicos
- [ ] **Store flexible documents (KYC)**: Documentos KYC almacenados
- [ ] **Trigger compliance checks in MS4**: Integración con MS4 funciona

### ✅ Requisitos Técnicos Cumplidos

- [ ] **Node.js + TypeScript**: Implementado correctamente
- [ ] **MongoDB**: Base de datos configurada y funcionando
- [ ] **REST API**: Endpoints RESTful implementados
- [ ] **Validación**: Joi schemas funcionando
- [ ] **Seguridad**: Rate limiting, CORS, Helmet configurados
- [ ] **Error Handling**: Manejo robusto de errores
- [ ] **Docker**: Contenedorización completa
- [ ] **Documentación**: README completo

### ✅ Calidad de Código

- [ ] **TypeScript**: Sin errores de compilación
- [ ] **ESLint**: Código sigue estándares
- [ ] **Estructura**: Arquitectura limpia y modular
- [ ] **Logging**: Logs apropiados para debugging
- [ ] **Environment**: Variables de entorno configuradas

## 🎯 Criterios de Aceptación Final

Para considerar el entregable completo, todos estos tests deben pasar:

1. ✅ **Funcionalidad Core**: Tests 1-5 pasan
2. ✅ **Integración**: Tests 6-8 pasan  
3. ✅ **Seguridad**: Tests 9-11 pasan
4. ✅ **Persistencia**: Tests 12-13 pasan
5. ✅ **Performance**: Tests 14-15 pasan
6. ✅ **Error Handling**: Tests 16-18 pasan
7. ✅ **Documentación**: README y código documentado
8. ✅ **Containerización**: Docker y docker-compose funcionan

## 🚀 Siguiente Paso: Presentación

Una vez que todos los tests pasen, el microservicio estará listo para:

1. **Demostración en clase**: Mostrar funcionamiento de endpoints
2. **Revisión de código**: Arquitectura y calidad
3. **Integración**: Conexión con otros microservicios del ecosistema
4. **Deployment**: Preparado para entornos de staging/producción

---

**¡El MS1 Customer Service está listo para el entregable de la Semana 7! 🎉**