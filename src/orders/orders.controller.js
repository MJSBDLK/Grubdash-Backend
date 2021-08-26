const path = require('path');

// Use the existing order data
const orders = require(path.resolve('src/data/orders-data'));

// Use this function to assigh ID's when necessary
const nextId = require('../utils/nextId');

// TODO: Implement the /orders handlers needed to make the tests pass

function validateFields(req, res, next) {
  const { data } = req.body;
  const { data: { dishes } = {} } = req.body;
  const reqFields = ['deliverTo', 'mobileNumber', 'dishes'];
  reqFields.forEach((field) => {
    if (!data[field]) {
      return next({
        status: 400,
        message: `Dish must include a ${field}`,
      });
    }
  });
  if (!dishes.length || !Array.isArray(dishes)) {
    return next({
      status: 400,
      message: `Order must include at lease one dish.`,
    });
  }
  for (let i in dishes) {
    const q = dishes[i].quantity;
    if (!q || q < 1 || !Number.isInteger(q)) {
      return next({
        status: 400,
        message: `Dish ${i} must have a quantity that is an integer greater than 0`,
      });
    }
  }
  return next();
}

function validateOrderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.foundOrder = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order ${orderId} not found.`,
  });
}

function validateStatus(req, res, next) {
  const { data: { status } = {} } = req.body;
  const validStatuses = [
    'pending',
    'preparing',
    'out-for-delivery',
    'delivered',
  ];
  if (!status || !validStatuses.includes(status)) {
    return next({
      status: 400,
      message: `Order must have a status of ${validStatuses.join(', ')}`,
    });
  } else if (status === 'delivered') {
    next({
      status: 400,
      message: `A delivered order cannot be changed.`,
    });
  }
  next();
}

function validateMatchingId(req, res, next) {
  const { id } = req.body.data;
  const { orderId } = req.params;
  if (id && id != orderId) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
  }
  return next();
}

function validatePending(req, res, next) {
  if (res.locals.foundOrder.status === 'pending') {
    return next();
  }
  return next({
    status: 400,
    message: `Gotta be pending my guy`,
  });
}

function list(req, res) {
  res.json({ data: orders });
}

function create(req, res) {
  const newOrder = req.body.data;
  newOrder.id = nextId();
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res) {
  res.json({ data: res.locals.foundOrder });
}

function update(req, res) {
  const newOrder = req.body.data;
  if (!newOrder.id) {
    newOrder.id = req.params.orderId;
  }
  let oldOrder = orders.find((order) => order.id === newOrder.id);
  oldOrder = newOrder;
  res.status(200).json({ data: newOrder });
}

function destroy(req, res) {
  orders.splice(orders.indexOf(res.locals.foundOrder), 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [validateFields, create],
  read: [validateOrderExists, read],
  update: [
    validateOrderExists,
    validateFields,
    validateStatus,
    validateMatchingId,
    update,
  ],
  delete: [validateOrderExists, validatePending, destroy],
};
