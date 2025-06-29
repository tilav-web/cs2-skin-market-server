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

## Steam Authentication Endpoints

### 1. POST /users/steam-auth/initiate

Bu endpoint Steam authentication ni boshlash uchun ishlatiladi. Telegram Mini Apps dan chaqiriladi.

#### Request Body

```json
{
  "telegram_id": "string",
  "return_url": "string"
}
```

#### Response

```json
{
  "success": true,
  "message": "Steam authentication initiated",
  "data": {
    "auth_url": "https://steamcommunity.com/openid/login?...",
    "telegram_id": "string"
  }
}
```

### 2. GET /users/steam-auth/callback

Bu endpoint Steam dan qaytgan callback ni handle qiladi. Steam authentication tugagandan so'ng avtomatik ravishda chaqiriladi.

#### Query Parameters

- `openid.mode`: Steam OpenID mode
- `openid.identity`: Steam user identity
- `openid.claimed_id`: Steam claimed ID
- `telegram_id`: User's Telegram ID
- `return_url`: Frontend URL to redirect after authentication

#### Response

Muvaffaqiyatli bo'lsa, frontend ga redirect qiladi:
```
http://localhost:5173?auth=success&telegram_id=123456789
```

Xatolik bo'lsa:
```
http://localhost:5173?auth=error&message=error_message
```

JWT token avtomatik ravishda HTTP-only cookie sifatida o'rnatiladi.

### 3. POST /users/steam-login (Legacy)

Bu endpoint to'g'ridan-to'g'ri Steam ma'lumotlari bilan login qilish uchun.

#### Request Body

```json
{
  "telegram_id": "string",
  "steam_id": "string", 
  "steam_token": "string",
  "personaname": "string",
  "token_expires_at": "2024-01-01T00:00:00.000Z"
}
```

## Telegram Mini Apps Integration

Telegram Mini Apps da Steam authentication ni quyidagicha ishlatish mumkin:

```javascript
// 1. Steam authentication ni boshlash
const response = await fetch('/users/steam-auth/initiate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    telegram_id: window.Telegram.WebApp.initDataUnsafe.user.id,
    return_url: window.location.origin + '/auth/callback'
  })
});

const { data } = await response.json();

// 2. Steam authentication URL ga yo'naltirish
window.location.href = data.auth_url;

// 3. Callback da authentication natijasini tekshirish
const urlParams = new URLSearchParams(window.location.search);
const authStatus = urlParams.get('auth');

if (authStatus === 'success') {
  // Authentication muvaffaqiyatli
  console.log('Steam authentication successful');
} else if (authStatus === 'error') {
  // Xatolik
  console.error('Authentication failed:', urlParams.get('message'));
}
```

## Environment Variables

Make sure to set the following environment variables:

- `JWT_SECRET`: Secret key for JWT token signing
- `STEAM_API_KEY`: Steam API key for Steam integration
- `FRONTEND_URL`: Frontend URL for redirects
- `MONGODB_URI`: MongoDB connection string
- `NODE_ENV`: Environment (development/production)
- `CORS_ORIGIN`: CORS origin for frontend
