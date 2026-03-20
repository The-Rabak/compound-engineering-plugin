---
name: laravel-conventions
description: >-
  Modern Laravel 11+ / PHP 8.3+ coding standards reference. Use when writing or reviewing PHP/Laravel code to ensure
  convention compliance.
---

## Goal
Apply modern Laravel 11+ and PHP 8.3+ conventions when writing or reviewing Laravel code.

## Use this skill when
- Writing Laravel or PHP code.
- Reviewing Laravel code for conventions, structure, and safety.
- Choosing patterns for controllers, requests, actions, services, models, resources, jobs, routes, or tests.

## Do not use this skill when
- The task is not Laravel or PHP.
- The codebase intentionally follows a different framework or architecture.

## Operating rules
- Prefer this architecture:
  ```text
  Controller -> FormRequest -> Action/Service -> Model
  ```
- Keep controllers thin and single-purpose.
- Use `declare(strict_types=1);` at the top of every PHP file.
- Prefer readonly DTOs, enums over constants, named arguments, match expressions, first-class callables, and full type declarations.
- Enforce PSR-12 with Laravel Pint.
- Use single quotes unless interpolation is needed.
- Use short arrays with trailing commas.
- Avoid `mixed` unless absolutely necessary.
- Prefer constructor property promotion.
- Validate with FormRequest classes and authorize with Policies.
- Eager load relationships and prevent lazy loading in development.
- Use API Resources for JSON responses.
- Use queued jobs with retries, backoff, timeout, and `failed()` handling.

## Procedure / Reference
### PHP 8.3+ patterns
```php
declare(strict_types=1);

readonly class CreateUserData {
    public function __construct(
        public string $name,
        public string $email,
        public ?string $phone = null,
    ) {}
}

enum UserStatus: string {
    case Active = 'active';
    case Suspended = 'suspended';
    case Pending = 'pending';
}

$users->map($this->transformUser(...));
Cache::put(key: $cacheKey, value: $data, ttl: 3600);

$label = match($status) {
    UserStatus::Active => 'Active User',
    UserStatus::Suspended => 'Account Suspended',
    default => 'Unknown',
};
```

### Naming conventions
| Type | Convention | Example |
|------|------------|---------|
| Classes | PascalCase | `UserService` |
| Methods | camelCase | `getUserById` |
| Properties/Variables | camelCase | `$userData` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Database tables | plural, snake_case | `user_accounts` |
| Database columns | snake_case | `created_at` |
| Routes | kebab-case | `/user-profiles` |
| Config keys | snake_case | `cache.default_ttl` |
| Enums | PascalCase | `UserStatus::Active` |

### Suggested directory structure
```text
app/
|- Actions/
|- Console/Commands/
|- DTOs/
|- Enums/
|- Events/
|- Exceptions/
|- Http/
|  |- Controllers/
|  |- Middleware/
|  |- Requests/
|  `- Resources/
|- Jobs/
|- Listeners/
|- Mail/
|- Models/
|  `- Concerns/
|- Notifications/
|- Observers/
|- Policies/
|- Providers/
|- Rules/
`- Services/
database/
|- factories/
|- migrations/
`- seeders/
routes/
|- api.php
|- web.php
`- console.php
tests/
|- Feature/
|- Unit/
`- Pest.php
```

### Eloquent best practices
```php
protected $casts = [
    'email_verified_at' => 'datetime',
    'status' => UserStatus::class,
    'settings' => 'array',
    'is_admin' => 'boolean',
];

public function scopeActive(Builder $query): Builder
{
    return $query->where('status', UserStatus::Active);
}

Model::preventLazyLoading(! app()->isProduction());
Model::shouldBeStrict(! app()->isProduction());
User::with(['posts', 'profile'])->get();
```

Migration naming:
```text
YYYY_MM_DD_HHMMSS_description.php
```

Migration example:
```php
Schema::create('posts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('title');
    $table->string('slug')->unique();
    $table->text('body');
    $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
    $table->timestamp('published_at')->nullable();
    $table->timestamps();
    $table->softDeletes();

    $table->index(['status', 'published_at']);
});
```

### API Resources
```php
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'posts' => PostResource::collection($this->whenLoaded('posts')),
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}

return UserResource::make($user);
return UserResource::collection($users);
```

### Jobs and queues
```php
class ProcessPayment implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;
    public int $backoff = 60;
    public int $timeout = 120;

    public function __construct(
        private readonly Order $order,
    ) {}

    public function handle(PaymentGateway $gateway): void
    {
        $gateway->charge($this->order);
    }

    public function failed(\Throwable $exception): void
    {
        // Notify team of failure
    }
}
```

### Routes and security
- Use controller class references.
- Group related routes.
- Use Sanctum or Passport for API auth.
- Use FormRequest validation.
- Use Policies instead of Gates in controllers.
- Use `$request->validated()`.
- Rate-limit API routes.
- Encrypt sensitive data at rest.

### Testing and verification
```bash
php artisan test
./vendor/bin/pest
./vendor/bin/pest tests/Feature/UserTest.php
./vendor/bin/pest --filter "creates a user"
php artisan test --parallel
./vendor/bin/pint
./vendor/bin/pint --test
./vendor/bin/phpstan analyse
```
