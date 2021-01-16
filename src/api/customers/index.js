import Router from 'koa-router';
import * as customersCtrl from './customers.ctrl';
import checkLoggedIn from '../../lib/checkLoggedIn';

const customers = new Router();

customers.get('/', customersCtrl.list);
customers.post('/', checkLoggedIn, customersCtrl.register);

const customer = new Router(); // /api/customers/:id
customer.get('/', customersCtrl.read);
customer.delete('/', checkLoggedIn, customersCtrl.checkOwnCustomer, customersCtrl.remove);
customer.patch('/', checkLoggedIn, customersCtrl.checkOwnCustomer, customersCtrl.update);

customers.use('/:id', customersCtrl.getCustomerById, customer.routes());

export default customers;
