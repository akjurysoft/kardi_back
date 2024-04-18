const jwt = require("jsonwebtoken");
const ejs = require("ejs");
const { uploadFile } = require('../helpers')
const {
    makeHash,
    checkHash,
    mailer,
    makeToken,
    checkToken,
    makeRefreshToken,
    env: {
        HEADER,
        ENVIRONMENT,
        LOCAL_URL,
        OTP_SEND_URL,
        MSG91_AUTH_KEY,
        MSG91_OTP_TEMP_ID,
    },
    sequelize,
} = require("../config");
const {
    CarBrands, Banners, BannerProductAssociations, Categories, SubCategories, SuperSubCategories, Coupons, Discounts, ProductDiscounts, Products, ProductBrands, ProductImages
} = require("../models");
const { Op } = require("sequelize");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const fetchAllDiscounts = async (req, res) => {
    try {

        const user = await checkToken(req.headers['Authorization'] ? req.headers['Authorization'] : req.headers.authorization)
        if (user.role === "ADMIN" && user.application === 'kardify') {
            const allDiscounts = await Discounts.findAll({
                include: [
                    {
                        model: Categories
                    },
                    {
                        model: SubCategories
                    },
                    {
                        model: SuperSubCategories
                    },
                    {
                        model: ProductBrands
                    },
                    {
                        model: ProductDiscounts,
                        include: [
                            {
                                model: Products
                            }
                        ]
                    }
                ],
                nest: true,
                mapToModel: true,
                order: [['id', 'DESC']],
                // raw: true
            });
            return res.response({
                code: 200,
                status: 'success',
                message: 'All discounts fetched successfully',
                discounts: allDiscounts,
            }).code(200);
        } else if (user === 'Session expired') {
            return res.response({
                code: 401,
                status: 'error',
                message: user
            }).code(401);
        } else {
            return res.response({
                code: 403,
                status: 'error',
                message: "You don't have permission for this action."
            }).code(403);
        }
    } catch (error) {
        console.error(error);
        return res.response({
            code: 500,
            status: 'error',
            message: 'Something went wrong',
        }).code(500);
    }
};

const fetchAllDiscountsToShowLikeBanner = async (req, res) => {
    try {
        const { discount_id } = req.query;

        let filter = {
            status: true
        };
        if (discount_id) filter = {
            ...filter,
            id: discount_id
        }
        const allDiscounts = await Discounts.findAll({
            where: filter,
            include: [
                {
                    model: Categories
                },
                {
                    model: SubCategories
                },
                {
                    model: SuperSubCategories
                },
                {
                    model: ProductBrands
                },
                {
                    model: ProductDiscounts,
                    include: [
                        {
                            model: Products,
                            include: [
                                {
                                    model: ProductImages,
                                    as: 'images'
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [['id', 'DESC']],
            // raw: true
        });

        const currentDate = new Date();

        if (discount_id && allDiscounts.length > 0) {
            const discount = allDiscounts[0];
            discount.product_discount_associations.forEach(discountAssoc => {
                const product = discountAssoc.product;
                const start_date = new Date(product.offer_start_date);
                const expiry_date = new Date(product.offer_end_date);
                if (currentDate >= start_date && currentDate <= expiry_date) {
                    product.discount = product.offer_discount;
                    product.discount_type = product.offer_discount_type;
                }
            });
        }

        return res.response({
            code: 200,
            status: 'success',
            message: 'All discounts fetched successfully',
            discounts: allDiscounts,
        }).code(200);
    } catch (error) {
        console.error(error);
        return res.response({
            code: 500,
            status: 'error',
            message: 'Something went wrong',
        }).code(500);
    }
};

// const createDiscount = async (req, res) => {
//     try {
//         const {
//             discount_name,
//             image,
//             product_brand_id,
//             category_id,
//             sub_category_id,
//             super_sub_category_id,
//             products,
//             discount_type,
//             discount,
//             min_amount,
//             max_amount,
//             start_date,
//             expiry_date,
//         } = req.payload;

//         const existingDiscount = await Discounts.findOne({
//             where: {
//                 discount_name,
//             },
//         });

//         if (existingDiscount) {
//             return res.response({
//                 code: 400,
//                 status: 'error',
//                 message: 'A discount with the same name already exists',
//             }).code(400);
//         }

//         const { file_url } = await uploadFile(req, image, 'uploads/offers/')

//         const createdDiscount = await Discounts.create({
//             discount_name,
//             image: file_url,
//             product_brand_id,
//             category_id,
//             sub_category_id,
//             super_sub_category_id,
//             discount_type,
//             discount,
//             min_amount,
//             max_amount,
//             start_date,
//             expiry_date,
//             status: true
//         });

//         const associatedProducts = [];

//         if (products) {
//             const productsParse = JSON.parse(products);
//             if (productsParse) {
//                 for (const product of productsParse) {
//                     const productAssociation = await ProductDiscounts.create({
//                         discount_id: createdDiscount.id,
//                         product_id: product.product_id,
//                     });

//                     await Products.update(
//                         {
//                             is_offer_avl: true,
//                             offer_discount: discount,
//                             offer_discount_type: discount_type,
//                             offer_start_date: start_date,
//                             offer_end_date: expiry_date
//                         },
//                         {
//                             where: { id: product.product_id }
//                         }
//                     );


//                     const associatedProductDetails = await Products.findOne({
//                         where: { id: productAssociation.product_id },
//                         attributes: ['id', 'product_name'],
//                     });

//                     return res.response({
//                         code: 201,
//                         status: 'success',
//                         message: 'Discount created successfully',
//                         products: associatedProductDetails
//                     }).code(201);
//                 }
//             }
//         }

//         if(product_brand_id){
//             const productsByBrand = await Products.findAll({
//                 where: { id: product_brand_id },
//                 attributes: ['id', 'product_name'],
//             })

//             if(!productsByBrand) {
//                 return res.response({
//                     code: 404,
//                     status: 'error',
//                     message: 'Product not found',
//                 }).code(404);
//             }

//             for(const product of productsByBrand){
//                 await Products.update(
//                     {
//                         is_offer_avl: true,
//                         offer_discount: discount,
//                         offer_discount_type: discount_type,
//                         offer_start_date: start_date,
//                         offer_end_date: expiry_date
//                     },
//                     {
//                         where: { id: product.id }
//                     }
//                 );
//             }
//             return res.response({
//                 code: 201,
//                 status: 'success',
//                 message: 'Discount created successfully',
//             }).code(201);
//         }

//         if(category_id){
//             const productsByCategory = await Products.findAll({
//                 where: { category_id },
//                 attributes: ['id', 'product_name'],
//             })

//             for(const product of productsByCategory){
//                 await Products.update(
//                     {
//                         is_offer_avl: true,
//                         offer_discount: discount,
//                         offer_discount_type: discount_type,
//                         offer_start_date: start_date,
//                         offer_end_date: expiry_date
//                     },
//                     {
//                         where: { id: product.id }
//                     }
//                 );
//             }

//             return res.response({
//                 code: 201,
//                 status: 'success',
//                 message: 'Discount created successfully',
//             }).code(201);
//         }



//     } catch (error) {
//         console.error(error);
//         return res.response({
//             code: 500,
//             status: 'error',
//             message: 'Something went wrong',
//         }).code(500);
//     }
// };

const createDiscount = async (req, res) => {
    try {
        const {
            discount_name,
            image,
            product_brand_id,
            category_id,
            sub_category_id,
            super_sub_category_id,
            products,
            discount_type,
            discount,
            min_amount,
            max_amount,
            start_date,
            expiry_date,
        } = req.payload;

        const existingDiscount = await Discounts.findOne({
            where: {
                discount_name,
            },
        });

        if (existingDiscount) {
            return res.response({
                code: 400,
                status: 'error',
                message: 'A discount with the same name already exists',
            }).code(400);
        }

        const { file_url } = await uploadFile(req, image, 'uploads/offers/');

        const createdDiscount = await Discounts.create({
            discount_name,
            image: file_url,
            product_brand_id,
            category_id,
            sub_category_id,
            super_sub_category_id,
            discount_type,
            discount,
            min_amount,
            max_amount,
            start_date,
            expiry_date,
            status: true
        });

        if (products) {
            const productsParse = JSON.parse(products);
            if (productsParse) {
                for (const product of productsParse) {
                    const productAssociation = await ProductDiscounts.create({
                        discount_id: createdDiscount.id,
                        product_id: product.product_id,
                    });

                    await Products.update(
                        {
                            is_offer_avl: true,
                            offer_discount: discount,
                            offer_discount_type: discount_type,
                            offer_start_date: start_date,
                            offer_end_date: expiry_date
                        },
                        {
                            where: { id: product.product_id }
                        }
                    );
                }
            }
        }

        if (product_brand_id) {
            const productsByBrand = await Products.findAll({
                where: { product_brand_id },
                attributes: ['id', 'product_name'],
            });

            for (const product of productsByBrand) {
                await Products.update(
                    {
                        is_offer_avl: true,
                        offer_discount: discount,
                        offer_discount_type: discount_type,
                        offer_start_date: start_date,
                        offer_end_date: expiry_date
                    },
                    {
                        where: { id: product.id }
                    }
                );
            }
        }

        if (category_id) {
            const productsByCategory = await Products.findAll({
                where: { category_id },
                attributes: ['id', 'product_name'],
            });

            for (const product of productsByCategory) {
                await Products.update(
                    {
                        is_offer_avl: true,
                        offer_discount: discount,
                        offer_discount_type: discount_type,
                        offer_start_date: start_date,
                        offer_end_date: expiry_date
                    },
                    {
                        where: { id: product.id }
                    }
                );
            }
        }

        if (category_id && products) {
            const productsParse = JSON.parse(products);

            for (const product of productsParse) {
                await Products.update(
                    {
                        is_offer_avl: true,
                        offer_discount: discount,
                        offer_discount_type: discount_type,
                        offer_start_date: start_date,
                        offer_end_date: expiry_date
                    },
                    {
                        where: { id: product.product_id }
                    }
                );
            }

            const productsByCategory = await Products.findAll({
                where: { category_id },
                attributes: ['id', 'product_name'],
            });

            for (const product of productsByCategory) {
                await Products.update(
                    {
                        is_offer_avl: true,
                        offer_discount: discount,
                        offer_discount_type: discount_type,
                        offer_start_date: start_date,
                        offer_end_date: expiry_date
                    },
                    {
                        where: { id: product.id }
                    }
                );
            }
        }

        return res.response({
            code: 201,
            status: 'success',
            message: 'Discount created successfully',
        }).code(201);
    } catch (error) {
        console.error(error);
        return res.response({
            code: 500,
            status: 'error',
            message: 'Something went wrong',
        }).code(500);
    }
};


const editDiscount = async (req, res) => {
    try {
        const { discount_id, discount_name, discount_type, discount, min_amount, max_amount, start_date, expiry_date } = req.payload;

        const existingDiscount = await Discounts.findByPk(discount_id);
        if (!existingDiscount) {
            return res.response({
                code: 404,
                status: 'error',
                message: 'Discount not found',
            }).code(404);
        }

        await existingDiscount.update({
            discount_name,
            discount_type,
            discount,
            min_amount,
            max_amount,
            start_date,
            expiry_date,
        });

        return res.response({
            code: 200,
            status: 'success',
            message: 'Discount updated successfully',
            discount: existingDiscount,
        }).code(200);
    } catch (error) {
        console.error(error);
        return res.response({
            code: 500,
            status: 'error',
            message: 'Something went wrong',
        }).code(500);
    }
};


const toggleDiscountStatus = async (req, res) => {
    try {
        const { discount_id } = req.query;

        if (!Number.isInteger(discount_id) || discount_id <= 0) {
            return res.response({
                code: 400,
                status: 'error',
                message: 'Invalid discount_id',
            }).code(200);
        }

        const existingDiscount = await Discounts.findOne({
            where: {
                id: discount_id,
            },
            include: [
                {
                    model: Categories
                },
                {
                    model: SubCategories
                },
                {
                    model: SuperSubCategories
                },
                {
                    model: ProductBrands
                },
                {
                    model: ProductDiscounts
                },
            ]
        });

        if (!existingDiscount) {
            return res.response({
                code: 404,
                status: 'error',
                message: 'Discount not found',
            }).code(200);
        }

        existingDiscount.status = !existingDiscount.status;

        await existingDiscount.save();

        if (existingDiscount.category_id) {
            await Products.update(
                { is_offer_avl: existingDiscount.status },
                { where: { category_id: existingDiscount.category_id } }
            );
        }

        if (existingDiscount.product_brand_id) {
            await Products.update(
                { is_offer_avl: existingDiscount.status },
                { where: { product_brand_id: existingDiscount.product_brand_id } }
            );
        }

        console.log(existingDiscount)


        const productDiscountAssociations = existingDiscount.product_discount_associations;
        if (productDiscountAssociations) {
            for (const productDiscount of productDiscountAssociations) {
                await Products.update(
                    { is_offer_avl: existingDiscount.status },
                    { where: { id: productDiscount.product_id } }
                );
            }
        }

        return res.response({
            code: 200,
            status: 'success',
            message: 'Status toggled successfully',
            discount: existingDiscount,
        }).code(200);
    } catch (error) {
        console.error(error);
        return res.response({
            code: 500,
            status: 'error',
            message: 'Something went wrong',
        }).code(200);
    }
};


const deleteDiscount = async (req, res) => {
    try {
        const { discount_id } = req.query;

        const existingDiscount = await Discounts.findOne({
            where: {
                id: discount_id,
            },
        });

        if (!existingDiscount) {
            return res
                .response({
                    code: 404,
                    status: "error",
                    message: "Discount not found",
                })
                .code(200);
        }

        await existingDiscount.destroy();

        return res
            .response({
                code: 200,
                status: 'success',
                message: `${existingDiscount.discount_name} deleted successfully`,
            })
            .code(200);
    } catch (error) {
        console.error(error);
        return res
            .response({
                code: 500,
                status: "error",
                message: "Something went wrong",
            })
            .code(200);
    }
};

module.exports = {
    fetchAllDiscountsToShowLikeBanner,
    fetchAllDiscounts,
    createDiscount,
    editDiscount,
    toggleDiscountStatus,
    deleteDiscount
}