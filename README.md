<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

# CS2 Skin Market Server

## Steam Authentication Backend

Bu backend Steam foydalanuvchilarining ma'lumotlarini saqlash va CS2 skin inventory ni boshqarish uchun yaratilgan.

## O'rnatish

### 1. Dependencies o'rnatish
```bash
npm install
```

### 2. Environment variables sozlash
`env.example` faylini `.env` ga nusxalab, quyidagi ma'lumotlarni to'ldiring:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost/cs2-skins

# Steam API Configuration
STEAM_API_KEY=your_steam_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### 3. MongoDB o'rnatish va ishga tushirish
```bash
# MongoDB o'rnatish (Ubuntu/Debian)
sudo apt update
sudo apt install mongodb

# MongoDB ishga tushirish
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### 4. Server ishga tushirish
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## API Endpoints

### Authentication
- `POST /auth/steam/login` - Steam login
- `POST /auth/steam/logout` - Steam logout
- `GET /auth/session/validate` - Session tekshirish
- `GET /auth/steam/:steamId/inventory` - CS2 inventory olish

### Users
- `GET /users` - Barcha foydalanuvchilar
- `GET /users/:steamId` - Foydalanuvchi ma'lumotlari
- `PATCH /users/:steamId` - Foydalanuvchi ma'lumotlarini yangilash
- `DELETE /users/:steamId` - Foydalanuvchini o'chirish
- `POST /users/:steamId/token` - Steam token yangilash
- `POST /users/:steamId/inventory` - CS2 inventory yangilash
- `GET /users/:steamId/inventory` - CS2 inventory olish
- `POST /users/:steamId/favorites/:skinId` - Sevimli skin qo'shish
- `DELETE /users/:steamId/favorites/:skinId` - Sevimli skin o'chirish
- `POST /users/:steamId/session` - Session token qo'shish
- `DELETE /users/:steamId/session` - Session token o'chirish
- `POST /users/:steamId/trade` - Savdo qayd etish

### Statistics
- `GET /users/top-traders` - Eng yaxshi savdogarlar
- `GET /users/with-inventory` - Inventory ga ega foydalanuvchilar

## Database Schema

### User Collection
```typescript
{
  steamId: string,                    // Steam ID (unique)
  personaname: string,               // Steam username
  realname?: string,                 // Real name
  profileurl: string,                // Steam profile URL
  avatar: string,                    // Avatar URL
  avatarmedium: string,              // Medium avatar URL
  avatarfull: string,                // Full avatar URL
  personastate: number,              // Online status
  communityvisibilitystate: number,  // Profile visibility
  profilestate: number,              // Profile state
  lastlogoff: number,                // Last logout time
  commentpermission: number,         // Comment permission
  
  // Steam authentication
  steamToken?: string,               // Steam token
  tokenExpiresAt?: Date,             // Token expiration
  
  // CS2 Inventory
  cs2Inventory: any[],               // CS2 skins array
  lastInventoryUpdate?: Date,        // Last inventory update
  
  // User settings
  isActive: boolean,                 // Account status
  isVerified: boolean,               // Verification status
  roles: string[],                   // User roles
  
  // Trading statistics
  tradeCount: number,                // Total trades
  successfulTrades: number,          // Successful trades
  favoriteSkins: string[],           // Favorite skin IDs
  
  // Session management
  sessionTokens: string[],           // Active session tokens
  lastLoginAt?: Date,                // Last login time
  lastActivityAt?: Date,             // Last activity time
  
  // Timestamps
  createdAt: Date,                   // Account creation time
  updatedAt: Date                    // Last update time
}
```

## Console Logs

### Authentication Process:
- 🔐 Steam login request
- 🔍 Validating Steam user
- ✅ Steam user data fetched
- ✅ User created/updated
- 🔑 Token updated
- 🚪 User logged out

### CS2 Inventory:
- 🎮 CS2 inventory request
- 📦 Inventory items count
- ✅ Inventory updated
- ✅ CS2 inventory fetched

### Session Management:
- 🔐 Session validation request
- ✅ Session token validated
- ✅ Session token added/removed

## Features

- ✅ Steam OpenID authentication
- ✅ User data management
- ✅ Session token management
- ✅ CS2 inventory fetching and storage
- ✅ Trading statistics tracking
- ✅ Favorite skins management
- ✅ User roles and permissions
- ✅ Activity tracking
- ✅ MongoDB integration
- ✅ RESTful API endpoints

## Security

- Session token validation
- Steam token expiration checking
- User activity tracking
- Role-based access control
- Input validation with DTOs
- Error handling and logging
