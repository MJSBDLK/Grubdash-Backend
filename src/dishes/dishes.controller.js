const path = require('path');
const { forEach } = require('../data/dishes-data');

// Use the existing dishes data
const dishes = require(path.resolve('src/data/dishes-data'));

// Use this function to assign ID's when necessary
const nextId = require('../utils/nextId');

// TODO: Implement the /dishes handlers needed to make the tests pass

function validateFields(req, res, next) {
  const { data } = req.body;
  const { data: { price } = {} } = req.body;
  const reqFields = ['name', 'description', 'price', 'image_url'];
  reqFields.forEach((field) => {
    if (!data[field]) {
      return next({
        status: 400,
        message: `Dish mush include a ${field}`,
      });
    }
  });
  if (price < 1 || !Number.isInteger(price)) {
    return next({
      status: 400,
      message: `Dish must have a price that is an integer greater than 0.`,
    });
  }
  res.locals.newDish = req.body.data;
  next();
}

function validateDishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.foundDish = foundDish;
    return next();
  }
  return next({
    status: 404,
    message: `Dish does not exist: ${dishId}`,
  });
}

function validateMatchingId(req, res, next) {
  const { id } = req.body.data;
  const { dishId } = req.params;
  if (id && id !== dishId) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}.`,
    });
  }
  next();
}

function update(req, res) {
  const newDish = req.body.data;
  let oldDish = dishes.find((dish) => dish.id === newDish.id);
  if (!newDish.id) {
    newDish.id = req.params.dishId;
  }
  oldDish = newDish;
  res.json({ data: newDish });
}

function read(req, res) {
  res.json({ data: res.locals.foundDish });
}

function create(req, res) {
  const { newDish } = res.locals;
  newDish.id = nextId();
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function list(req, res) {
  res.json({ data: dishes });
}

module.exports = {
  list,
  create: [validateFields, create],
  read: [validateDishExists, read],
  update: [validateDishExists, validateFields, validateMatchingId, update],
};
