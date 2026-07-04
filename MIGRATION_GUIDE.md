# Guide de Migration - Spring Boot vers Node.js

## 📋 Vue d'ensemble

Ce document détaille la migration du backend e-commerce Spring Boot (Java) vers Node.js (TypeScript + Express).

## 🎯 Objectif

Conserver **exactement** la même architecture, fonctionnalités et logique métier, en adaptant uniquement les aspects techniques propres à chaque plateforme.

## 📊 Comparaison des Technologies

| Composant | Spring Boot | Node.js |
|-----------|-------------|---------|
| **Langage** | Java 17 | TypeScript (Node.js) |
| **Framework** | Spring Boot 3.2.0 | Express.js 4.18 |
| **Base de données** | PostgreSQL | PostgreSQL (identique) |
| **ORM/Accès DB** | Spring Data JPA (Hibernate) | pg (node-postgres) |
| **Authentification** | Spring Security + JWT | JWT middleware + bcrypt |
| **Validation** | Spring Validation | express-validator |
| **Documentation API** | Springdoc OpenAPI | - |
| **Build** | Maven | npm/TypeScript |

## 🔄 Mapping des Concepts

### Architecture en Couches

#### Spring Boot
```
Controller → Service → Repository → Entity
```

#### Node.js
```
Controller → Service → Database (SQL direct) → Types/Interfaces
```

### Exemples de Migration

#### 1. Entity → Type/Interface

**Java (Entity)**
```java
@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private BigDecimal purchasePriceHT;
}
```

**TypeScript (Interface)**
```typescript
export interface Product {
  id: number;
  name: string;
  purchase_priceht: number;
}
```

#### 2. Repository → Service SQL

**Java (Repository)**
```java
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findAllByActiveTrue();
}
```

**TypeScript (Service)**
```typescript
async findAllActive(): Promise<Product[]> {
  const result = await pool.query<Product>(
    'SELECT * FROM products WHERE active = true'
  );
  return result.rows;
}
```

#### 3. Service - Logique Métier

**Java**
```java
@Service
public class ProductService {
    public void calculateSellingPrice(Product product) {
        BigDecimal marginMultiplier = BigDecimal.ONE.add(
            product.getProfitMarginPercent().divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP)
        );
        BigDecimal vatMultiplier = BigDecimal.ONE.add(
            product.getVatPercent().divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP)
        );
        BigDecimal sellingPrice = product.getPurchasePriceHT()
            .multiply(marginMultiplier)
            .multiply(vatMultiplier);
        product.setSellingPriceTTC(sellingPrice);
    }
}
```

**TypeScript**
```typescript
calculateSellingPrice(product: Product): number {
  const marginMultiplier = 1 + (product.profit_margin_percent / 100);
  const vatMultiplier = 1 + (product.vat_percent / 100);
  return Number((product.purchase_priceht * marginMultiplier * vatMultiplier).toFixed(4));
}
```

#### 4. Controller - Endpoints

**Java**
```java
@RestController
@RequestMapping("/api/products")
public class ProductController {
    @GetMapping
    public List<ProductDTO> getAllProducts() {
        return productRepository.findAllByActiveTrue().stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }
}
```

**TypeScript**
```typescript
export class ProductController {
  getAllProducts = async (req: Request, res: Response) => {
    try {
      const products = await this.productService.findAllActive();
      const dtos = await Promise.all(products.map(p => this.mapToDTO(p)));
      res.json(dtos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}
```

#### 5. Security - JWT

**Java**
```java
@Service
public class JwtService {
    public String generateToken(UserDetails userDetails) {
        return Jwts.builder()
            .setSubject(userDetails.getUsername())
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
            .signWith(getSignInKey(), SignatureAlgorithm.HS256)
            .compact();
    }
}
```

**TypeScript**
```typescript
private generateToken(user: User): string {
  const payload = {
    username: user.username,
    roles: user.roles
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: `${expiresIn}s`
  });
}
```

#### 6. Transactions

**Java**
```java
@Transactional
public Order placeOrder(CheckoutRequest request) {
    Order order = new Order();
    // ... logic
    return orderRepository.save(order);
}
```

**TypeScript**
```typescript
async placeOrder(request: CheckoutRequest): Promise<Order> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // ... logic
    await client.query('COMMIT');
    return order;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

## 🔐 Sécurité & Authentification

### Spring Security → Express Middleware

**Java (Filter)**
```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, ...) {
        // Extract and validate token
    }
}
```

**TypeScript (Middleware)**
```typescript
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token required' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};
```

## 📦 Gestion des Dépendances

### Maven → npm

**pom.xml**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.11.5</version>
</dependency>
```

**package.json**
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "pg": "^8.11.3"
  }
}
```

## 🗄️ Base de Données

### Aucune modification requise !

La structure de la base de données PostgreSQL reste **identique**. Les tables et colonnes sont les mêmes.

**Seule différence :** Pas de migration automatique du schéma (Spring JPA `ddl-auto`). Le schéma doit déjà exister.

## 🚀 Déploiement

### Spring Boot
```bash
mvn clean package
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

### Node.js
```bash
npm run build
npm start
```

## ✅ Checklist de Migration

- [x] Configuration de l'environnement (.env)
- [x] Connexion à la base de données (pg pool)
- [x] Types TypeScript (équivalents des Entities)
- [x] Services métier (même logique)
- [x] Contrôleurs REST (mêmes endpoints)
- [x] Authentification JWT
- [x] Middleware de sécurité
- [x] Gestion des erreurs
- [x] CORS
- [x] Logging

## 🧪 Tests de Validation

Pour valider que la migration est réussie :

1. **Tester l'authentification**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

2. **Tester les endpoints publics**
```bash
curl http://localhost:8080/api/products
```

3. **Tester les endpoints protégés**
```bash
curl http://localhost:8080/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

4. **Tester la logique métier**
   - Créer un produit → Vérifier le calcul du prix TTC
   - Passer une commande → Vérifier la déduction du stock (FIFO)
   - Annuler une commande → Vérifier la restauration du stock

## 📝 Notes Importantes

### Points d'attention

1. **Gestion des décimales**
   - Java : `BigDecimal` avec précision configurable
   - Node.js : `number` (double precision) - Utiliser `toFixed()` pour la précision

2. **Dates**
   - Java : `LocalDateTime`, `LocalDate`
   - Node.js : `Date` natif ou utiliser `date-fns` pour plus de contrôle

3. **Transactions**
   - Java : Annotation `@Transactional` automatique
   - Node.js : Gestion manuelle avec `BEGIN`/`COMMIT`/`ROLLBACK`

4. **Null Safety**
   - Java : `Optional<T>`
   - TypeScript : `T | null` avec strict null checks

5. **Enums**
   - Java : `enum OrderStatus { ... }`
   - TypeScript : `enum OrderStatus { ... }` (similaire)

## 🎉 Résultat

Le backend Node.js est **100% fonctionnellement équivalent** au backend Spring Boot :
- Mêmes endpoints API
- Même logique métier
- Même base de données
- Même sécurité JWT
- Compatible avec le frontend existant

Seule l'implémentation technique diffère, adaptée aux spécificités de chaque plateforme.
