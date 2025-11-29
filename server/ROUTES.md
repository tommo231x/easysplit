# EasySplit API Routes

Base URL: `https://easysplit-sn5f.onrender.com`

---

## Health Check Endpoints

### GET `/healthz`

Render platform health check endpoint.

**Example URL:** `https://easysplit-sn5f.onrender.com/healthz`

**Response (200 OK):**
```json
{
  "status": "ok"
}
```

---

### GET `/api/health`

API health check endpoint.

**Example URL:** `https://easysplit-sn5f.onrender.com/api/health`

**Response (200 OK):**
```json
{
  "status": "ok"
}
```

---

## Menu Endpoints

### POST `/api/menus`

Create a new menu with items.

**Example URL:** `https://easysplit-sn5f.onrender.com/api/menus`

**Request Body:**
```json
{
  "name": "Friday Dinner",
  "currency": "£",
  "items": [
    { "name": "Margherita Pizza", "price": 12.50 },
    { "name": "Caesar Salad", "price": 8.00 },
    { "name": "Garlic Bread", "price": 4.50 }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Optional name for the menu |
| `currency` | string | No | Currency symbol (default: "£") |
| `items` | array | Yes | Array of menu items (minimum 1) |
| `items[].name` | string | Yes | Item name (cannot be empty) |
| `items[].price` | number | Yes | Item price (must be positive) |

**Response (200 OK):**
```json
{
  "code": "ABC12345",
  "menu": {
    "id": 1,
    "code": "ABC12345",
    "name": "Friday Dinner",
    "currency": "£",
    "createdAt": "2025-11-29 12:00:00"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation error (missing items, invalid price, etc.)
```json
{
  "error": "Validation error",
  "details": [
    { "path": ["items"], "message": "At least one menu item is required" }
  ]
}
```

- **500 Internal Server Error** - Server error
```json
{
  "error": "Failed to create menu"
}
```

---

### GET `/api/menus/:code`

Get a menu and its items by code.

**URL Parameters:**
| Parameter | Description |
|-----------|-------------|
| `:code` | 6-8 character menu code (case-insensitive) |

**Example URL:** `https://easysplit-sn5f.onrender.com/api/menus/ABC12345`

**Response (200 OK):**
```json
{
  "menu": {
    "id": 1,
    "code": "ABC12345",
    "name": "Friday Dinner",
    "currency": "£",
    "createdAt": "2025-11-29 12:00:00"
  },
  "items": [
    { "id": 1, "menuId": 1, "name": "Margherita Pizza", "price": 12.50 },
    { "id": 2, "menuId": 1, "name": "Caesar Salad", "price": 8.00 },
    { "id": 3, "menuId": 1, "name": "Garlic Bread", "price": 4.50 }
  ]
}
```

**Error Responses:**

- **400 Bad Request** - Invalid code length
```json
{
  "error": "Menu code must be 6-8 characters"
}
```

- **404 Not Found** - Menu doesn't exist
```json
{
  "error": "Menu not found"
}
```

- **429 Too Many Requests** - Rate limit exceeded (100 requests per 10 minutes)
```json
{
  "error": "Too many requests, please try again later"
}
```

---

### PATCH `/api/menus/:code`

Update an existing menu by code.

**URL Parameters:**
| Parameter | Description |
|-----------|-------------|
| `:code` | 6-8 character menu code (case-insensitive) |

**Example URL:** `https://easysplit-sn5f.onrender.com/api/menus/ABC12345`

**Request Body:** (same format as POST /api/menus)
```json
{
  "name": "Updated Menu Name",
  "currency": "$",
  "items": [
    { "name": "New Item", "price": 15.00 }
  ]
}
```

**Response (200 OK):**
```json
{
  "menu": {
    "id": 1,
    "code": "ABC12345",
    "name": "Updated Menu Name",
    "currency": "$",
    "createdAt": "2025-11-29 12:00:00"
  },
  "items": [
    { "id": 4, "menuId": 1, "name": "New Item", "price": 15.00 }
  ]
}
```

**Error Responses:**

- **400 Bad Request** - Invalid code or validation error
- **404 Not Found** - Menu doesn't exist

---

### DELETE `/api/menus/:code`

Delete a menu by code.

**URL Parameters:**
| Parameter | Description |
|-----------|-------------|
| `:code` | 6-8 character menu code (case-insensitive) |

**Example URL:** `https://easysplit-sn5f.onrender.com/api/menus/ABC12345`

**Response (200 OK):**
```json
{
  "success": true
}
```

**Error Responses:**

- **400 Bad Request** - Invalid code length
- **404 Not Found** - Menu doesn't exist

---

## Bill Split Endpoints

### POST `/api/splits`

Create a new bill split.

**Example URL:** `https://easysplit-sn5f.onrender.com/api/splits`

**Request Body:**
```json
{
  "name": "Friday Dinner Split",
  "menuCode": "ABC12345",
  "currency": "£",
  "serviceCharge": 12.5,
  "tipPercent": 10,
  "people": [
    { "id": "p1", "name": "Alice" },
    { "id": "p2", "name": "Bob" }
  ],
  "items": [
    { "id": 1, "menuId": 1, "name": "Margherita Pizza", "price": 12.50 },
    { "id": 2, "menuId": 1, "name": "Caesar Salad", "price": 8.00 }
  ],
  "quantities": [
    { "itemId": 1, "personId": "p1", "quantity": 1 },
    { "itemId": 2, "personId": "p2", "quantity": 1 }
  ],
  "totals": [
    {
      "person": { "id": "p1", "name": "Alice" },
      "subtotal": 12.50,
      "service": 1.56,
      "tip": 1.25,
      "total": 15.31
    },
    {
      "person": { "id": "p2", "name": "Bob" },
      "subtotal": 8.00,
      "service": 1.00,
      "tip": 0.80,
      "total": 9.80
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Optional name for the split |
| `menuCode` | string | No | Optional link to a menu (must exist if provided) |
| `currency` | string | Yes | Currency symbol (e.g., "£", "$") |
| `serviceCharge` | number | Yes | Service charge percentage (0-100) |
| `tipPercent` | number | Yes | Tip percentage (0-100) |
| `people` | array | Yes | Array of people (minimum 1) |
| `people[].id` | string | Yes | Unique person ID |
| `people[].name` | string | Yes | Person's name |
| `items` | array | Yes | Array of items being split (minimum 1) |
| `items[].id` | number | Yes | Item ID |
| `items[].menuId` | number | No | Optional menu ID reference |
| `items[].name` | string | Yes | Item name |
| `items[].price` | number | Yes | Item price |
| `quantities` | array | Yes | Who ordered what (minimum 1) |
| `quantities[].itemId` | number | Yes | References items[].id |
| `quantities[].personId` | string | Yes | References people[].id |
| `quantities[].quantity` | number | Yes | Quantity ordered (positive integer) |
| `totals` | array | Yes | Pre-calculated totals per person (minimum 1) |
| `totals[].person` | object | Yes | Person object with id and name |
| `totals[].subtotal` | number | Yes | Subtotal before service/tip |
| `totals[].service` | number | Yes | Service charge amount |
| `totals[].tip` | number | Yes | Tip amount |
| `totals[].total` | number | Yes | Final total for this person |

**Response (200 OK):**
```json
{
  "code": "XYZ78901",
  "split": {
    "id": 1,
    "code": "XYZ78901",
    "name": "Friday Dinner Split",
    "menuCode": "ABC12345",
    "currency": "£",
    "serviceCharge": 12.5,
    "tipPercent": 10,
    "createdAt": "2025-11-29 12:30:00"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation error
```json
{
  "error": "Invalid split data",
  "details": [
    { "path": ["people"], "message": "Required" }
  ]
}
```

- **400 Bad Request** - Invalid menu code
```json
{
  "error": "Invalid menu code",
  "details": "The specified menu does not exist"
}
```

---

### GET `/api/splits/:code`

Get a bill split by code.

**URL Parameters:**
| Parameter | Description |
|-----------|-------------|
| `:code` | 6-8 character split code (case-insensitive) |

**Example URL:** `https://easysplit-sn5f.onrender.com/api/splits/XYZ78901`

**Response (200 OK):**
```json
{
  "code": "XYZ78901",
  "name": "Friday Dinner Split",
  "menuCode": "ABC12345",
  "currency": "£",
  "serviceCharge": 12.5,
  "tipPercent": 10,
  "createdAt": "2025-11-29 12:30:00",
  "people": [
    { "id": "p1", "name": "Alice" },
    { "id": "p2", "name": "Bob" }
  ],
  "items": [
    { "id": 1, "menuId": 1, "name": "Margherita Pizza", "price": 12.50 },
    { "id": 2, "menuId": 1, "name": "Caesar Salad", "price": 8.00 }
  ],
  "quantities": [
    { "itemId": 1, "personId": "p1", "quantity": 1 },
    { "itemId": 2, "personId": "p2", "quantity": 1 }
  ],
  "totals": [
    {
      "person": { "id": "p1", "name": "Alice" },
      "subtotal": 12.50,
      "service": 1.56,
      "tip": 1.25,
      "total": 15.31
    },
    {
      "person": { "id": "p2", "name": "Bob" },
      "subtotal": 8.00,
      "service": 1.00,
      "tip": 0.80,
      "total": 9.80
    }
  ]
}
```

**Error Responses:**

- **400 Bad Request** - Invalid code length
- **404 Not Found** - Split doesn't exist
- **429 Too Many Requests** - Rate limit exceeded

---

### PATCH `/api/splits/:code`

Update an existing bill split by code.

**URL Parameters:**
| Parameter | Description |
|-----------|-------------|
| `:code` | 6-8 character split code (case-insensitive) |

**Example URL:** `https://easysplit-sn5f.onrender.com/api/splits/XYZ78901`

**Request Body:** (same format as POST /api/splits)

**Response (200 OK):**
```json
{
  "code": "XYZ78901",
  "split": {
    "id": 1,
    "code": "XYZ78901",
    "name": "Updated Split Name",
    "menuCode": "ABC12345",
    "currency": "£",
    "serviceCharge": 15,
    "tipPercent": 12,
    "createdAt": "2025-11-29 12:30:00"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation error or invalid menu code
- **404 Not Found** - Split doesn't exist

---

### GET `/api/menus/:code/splits`

Get all bill splits associated with a menu.

**URL Parameters:**
| Parameter | Description |
|-----------|-------------|
| `:code` | 6-8 character menu code (case-insensitive) |

**Example URL:** `https://easysplit-sn5f.onrender.com/api/menus/ABC12345/splits`

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "code": "XYZ78901",
    "name": "Friday Dinner Split",
    "menuCode": "ABC12345",
    "people": "[{\"id\":\"p1\",\"name\":\"Alice\"}]",
    "items": "[...]",
    "quantities": "[...]",
    "currency": "£",
    "serviceCharge": 12.5,
    "tipPercent": 10,
    "totals": "[...]",
    "createdAt": "2025-11-29 12:30:00"
  }
]
```

**Error Responses:**

- **400 Bad Request** - Invalid code length

---

## Rate Limiting

The following endpoints are rate-limited to **100 requests per 10 minutes per IP**:

- `GET /api/menus/:code`
- `GET /api/splits/:code`

When rate limited, you'll receive:
```json
{
  "error": "Too many requests, please try again later"
}
```

Rate limit headers are included in responses:
- `RateLimit-Limit`
- `RateLimit-Remaining`
- `RateLimit-Reset`
