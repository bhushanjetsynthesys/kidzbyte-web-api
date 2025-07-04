const newsORM = require('../orm/newsDetails');
const { logger } = require('../utils/logger');
const { utilityConstants } = require('../constants/constants');
const { AppError } = require('../middlewares/errorHandler');

const getNews = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            category,
            status,
            author,
            hasQuiz,
            type
        } = req.query;

        // Build filter object
        const filter = { isActive: true };

        if (category) filter.category = category;
        if (status) filter.status = status;
        if (author) filter.author = new RegExp(author, 'i');
        if (hasQuiz !== undefined) filter.hasQuiz = hasQuiz === 'true';
        if (type) filter.type = type;

        // Get articles with pagination using ORM
        const result = await newsORM.getNews(
            parseInt(limit),
            parseInt(page),
            { createdAt: -1 },
            filter,
            '-__v',
            true
        );

        const responseData = {
            articles: result.docs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(result.totalCount / parseInt(limit)),
                totalCount: result.totalCount,
                hasNextPage: (parseInt(page) * parseInt(limit)) < result.totalCount,
                hasPreviousPage: parseInt(page) > 1
            }
        };
        return res.status(utilityConstants.serviceResponseCodes.success).json({
            success: true,
            message: utilityConstants.commonResponse.newsRetrieved,
            data: responseData
        });

    } catch (error) {
        logger.error('Error fetching news articles:', {
            error: error.message,
            stack: error.stack,
            query: req.query
        });

        // Handle known application errors
        if (error instanceof AppError) {
            return res.status(error.status).json({
                success: false,
                error: error.message,
                type: error.type
            });
        }

        // Handle unexpected errors
        return res.status(utilityConstants.serviceResponseCodes.serverError).json({
            success: false,
            error: utilityConstants.commonResponse.serverError,
            type: 'INTERNAL_ERROR'
        });
    }
};

module.exports = {
    getNews
};