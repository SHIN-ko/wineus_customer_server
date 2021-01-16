import Customer from '../../models/customer';
import mongoose from 'mongoose';
import Joi from 'joi';
import sanitizeHtml from 'sanitize-html';


const { ObjectId } = mongoose.Types;

const sanitizeOption = {
  allowedTags: [
    'h1',
    'h2',
    'b',
    'i',
    'u',
    's',
    'p',
    'ul',
    'ol',
    'li',
    'blockquote',
    'a',
    'img',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target'],
    img: ['src'],
    li: ['class'],
  },
  allowedSchemes: ['data', 'http'],
};

export const getCustomerById = async (ctx, next) => {
  const { id } = ctx.params;
  if (!ObjectId.isValid(id)) {
    ctx.status = 400; // Bad Request
    return;
  }
  try {
    const customer = await Customer.findById(id);
    // 포스트가 존재하지 않을 때
    if (!customer) {
      ctx.status = 404; // Not Found
      return;
    }
    ctx.state.customer = customer;
    return next();
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const checkOwnCustomer = (ctx, next) => {
  const { user, customer } = ctx.state;
  if (customer.user._id.toString() !== user._id) {
    ctx.status = 403;
    return;
  }
  return next();
};


//export const write = ctx => {};
/*
  CUSTOMER /api/customers
  {
    name: '이름',
    contactNumber: '연락처',
    address : '주소',
    butHistory : '구매이력',
    extra : '특징',
    wine_id : '와인ID'
  }
*/
export const register = async ctx => {
    const schema = Joi.object().keys({
      // 객체가 다음 필드를 가지고 있음을 검증
      name: Joi.string(), // required() 가 있으면 필수 항목
      contactNumber: Joi.string(),
      address: Joi.string(),
      advancedPayment : Joi.number(),
      extra :  Joi.array()
      .items(Joi.string()) // 문자열로 이루어진 배열
    });
 
    // 검증 후, 검증 실패시 에러처리
    const result = schema.validate(ctx.request.body);
    if (result.error) {
      ctx.status = 400; // Bad Request
      ctx.body = result.error;
      return;
    }
  
    const { name, contactNumber, address, advancedPayment, extra } = ctx.request.body;
    const customer = new Customer({
        name, 
        contactNumber, 
        address, 
        advancedPayment,
        extra,
        user: ctx.state.user,
    });
    try {
      await customer.save();
      ctx.body = customer;
    } catch (e) {
      ctx.throw(500, e);
    }
  };

// html 을 없애고 내용이 너무 길으면 200자로 제한시키는 함수
const removeHtmlAndShorten = body => {
  const filtered = sanitizeHtml(body, {
    allowedTags: [],
  });
  return filtered.length < 200 ? filtered : `${filtered.slice(0, 200)}...`;
};

export const list = async ctx => {
// query 는 문자열이기 때문에 숫자로 변환해주어야합니다.
  // 값이 주어지지 않았다면 1 을 기본으로 사용합니다.
  const page = parseInt(ctx.query.page || '1', 10);
  if (page < 1) {
    ctx.status = 400;
    return;
  }
  const { username } = ctx.query;
  // username 값이 유효하면 객체 안에 넣고, 그렇지 않으면 넣지 않음
  const query = {
    ...(username ? { 'user.username': username } : {}),
  };

  try {
    const customers = await Customer.find(query)
      .sort({ _id: -1 })
      .limit(10)
      .skip((page - 1) * 10)
      .lean()
      .exec();
    const customerCount = await Customer.countDocuments(query).exec();
    ctx.set('Last-Page', Math.ceil(customerCount / 10));
    ctx.body = customers.map(customer => ({
      ...customer,
      body: removeHtmlAndShorten(customer.body),
    }));
  } catch (e) {
    ctx.throw(500, e);
  }
};

/*
  GET /api/customers/:id
*/
export const read = async ctx => {
  ctx.body = ctx.state.customer;
};

/*
  DELETE /api/customers/:id
*/
export const remove = async ctx => {
  const { id } = ctx.params;
  try {
    await Customer.findByIdAndRemove(id).exec();
    ctx.status = 204; // No Content (성공은 했지만 응답할 데이터는 없음)
  } catch (e) {
    ctx.throw(500, e);
  }
};

/*
  PATCH /api/customers/:id
  {
    title: '수정',
    body: '수정 내용',
    tags: ['수정', '태그']
  }
*/
export const update = async ctx => {
  const { id } = ctx.params;
  // write 에서 사용한 schema 와 비슷한데, required() 가 없습니다.
  const schema = Joi.object().keys({
    name: Joi.string(),
    contactNumber: Joi.string(),
    address : Joi.string(),
    advancedPayment : Joi.number(),
    extra: Joi.array().items(Joi.string()),
  });

  // 검증 후, 검증 실패시 에러처리
  const result = Joi.validate(ctx.request.body, schema);
  if (result.error) {
    ctx.status = 400; // Bad Request
    ctx.body = result.error;
    return;
  }

  const nextData = { ...ctx.request.body }; // 객체를 복사하고
  // body 값이 주어졌으면 HTML 필터링
  if (nextData.body) {
    nextData.body = sanitizeHtml(nextData.body, sanitizeOption);
  }
  try {
    const customer = await Customer.findByIdAndUpdate(id, nextData, {
      new: true, // 이 값을 설정하면 업데이트된 데이터를 반환합니다.
      // false 일 때에는 업데이트 되기 전의 데이터를 반환합니다.
    }).exec();
    if (!customer) {
      ctx.status = 404;
      return;
    }
    ctx.body = customer;
  } catch (e) {
    ctx.throw(500, e);
  }
};
