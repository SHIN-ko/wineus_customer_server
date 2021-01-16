import Router from 'koa-router';
import posts from './posts';
import auth from './auth';
import customers from './customers';

const api = new Router();

api.use('/posts', posts.routes());
api.use('/auth', auth.routes());
api.use('/customers', customers.routes());

// 라우터를 내보냅니다.
export default api;
