// import the routes from the routes files
const banner_routes = require("./banners_routes");
const car_brands_routes = require("./car_brands_routes");
const car_lists_routes = require("./car_lists_routes");
const car_model_routes = require("./car_models_routes");
const category_routes = require("./category_routes");
const coupon_routes = require("./coupons_routes");
const delivery_routes = require("./delivery_types_routes");
const discount_routes = require("./discounts_routes");
const installers_routes = require("./installers_routes");
const order_routes = require("./orders_routes");
const product_attributes_routes = require("./product_attributes_routes");
const product_brands_routes = require("./product_brands_routes");
const product_routes = require("./product_routes");
const static_routes = require("./static_pages_routes");
const store_info_routes = require("./store_info_routes");
const stories_routes = require("./stories_routes");
const sub_category_routes = require("./sub_category_routes");
const subscribed_customers_routes = require("./subscribed_customers");
const super_sub_category_routes = require("./super_sub_category_routes");
const testimonials_info_routes = require("./testimonials_routes");
const user_routes = require("./user_routes");
const carts_routes = require("./carts_routes");
const wishlist_routes = require("./wishlist_routes");

// making a router plugin
module.exports = {
  name: "api Routes",
  version: "1.0.0",
  register: (server, options) => {
    server.route(user_routes);
    server.route(category_routes);
    server.route(sub_category_routes);
    server.route(super_sub_category_routes);
    server.route(product_attributes_routes);
    server.route(product_routes);
    server.route(car_brands_routes);
    server.route(car_model_routes);
    server.route(car_lists_routes);
    server.route(order_routes);
    server.route(delivery_routes);
    server.route(banner_routes);
    server.route(coupon_routes);
    server.route(discount_routes);
    server.route(product_brands_routes);
    server.route(installers_routes);
    server.route(subscribed_customers_routes);
    server.route(stories_routes);
    server.route(static_routes);
    server.route(store_info_routes);
    server.route(testimonials_info_routes);
    server.route(carts_routes);
    server.route(wishlist_routes);
  },
};
