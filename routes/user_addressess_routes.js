const tags = ["api", "User Address"];

const { category_controllers, carts_controllers, user_address_controllers } = require("../controllers");

const {
    categoriesValidators,
    usersValidation,
    headerValidator,
    CartValidators,
    usersAddressValidation
} = require("../validators");

const user_address_routes = [
    {
        method: "GET",
        path: "/get-all-addresses",
        options: {
            description: "Fetch all Address for Customer.",
            validate: {
                headers: headerValidator
            },
            tags,
            handler: user_address_controllers.getAllAddress,
        },
    },

    {
        method: "POST",
        path: "/add-addresses",
        options: {
            description: "Add Address for Customer.",
            validate: {
                headers: headerValidator,
                payload: usersAddressValidation.add_address_payload
            },
            tags,
            handler: user_address_controllers.addAddressForCustomer,
        },
    },
    
];

module.exports = user_address_routes;