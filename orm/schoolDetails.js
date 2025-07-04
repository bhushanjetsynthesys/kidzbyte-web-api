const SchoolDetails = require('../models/schoolDetails');
const { logger } = require('../utils/logger');

/**
 * Find all active schools with optional filtering
 * @param {Object} filters - Optional filters for the query
 * @param {Object} options - Query options (limit, skip, sort)
 * @returns {Promise<Array>} Array of school documents
 */
exports.findAllSchools = async (filters = {}, options = {}) => {
    try {
        const {
            limit = 50,
            skip = 0,
            sort = { name: 1 },
            select = null
        } = options;

        // Default filter to only show active schools
        const query = { ...filters };

        let queryBuilder = SchoolDetails.find(query)
            .limit(limit)
            .skip(skip)
            .sort(sort);

        if (select) {
            queryBuilder = queryBuilder.select(select);
        }

        const schools = await queryBuilder.exec();
        logger.info(`Found ${schools.length} schools`, { filters, options });
        return schools;
    } catch (error) {
        logger.error('Error in findAllSchools:', error);
        throw error;
    }
};

/**
 * Find school by ID
 * @param {String} schoolId - School ID
 * @returns {Promise<Object|null>} School document or null
 */
exports.findSchoolById = async (schoolId) => {
    try {
        const school = await SchoolDetails.findById(schoolId).exec();
        if (school) {
            logger.info(`School found: ${schoolId}`);
        } else {
            logger.info(`School not found: ${schoolId}`);
        }
        return school;
    } catch (error) {
        logger.error('Error in findSchoolById:', error);
        throw error;
    }
};

/**
 * Get total count of schools with optional filtering
 * @param {Object} filters - Optional filters for the query
 * @returns {Promise<Number>} Total count of schools
 */
exports.getSchoolsCount = async (filters = {}) => {
    try {
        const query = { isActive: true, ...filters };
        const count = await SchoolDetails.countDocuments(query).exec();
        logger.info(`Total schools count: ${count}`, { filters });
        return count;
    } catch (error) {
        logger.error('Error in getSchoolsCount:', error);
        throw error;
    }
};

/**
 * Search schools by name or location
 * @param {String} searchTerm - Search term
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of matching school documents
 */
exports.searchSchools = async (searchTerm, options = {}) => {
    try {
        const {
            limit = 20,
            skip = 0,
            sort = { name: 1 }
        } = options;

        const searchRegex = new RegExp(searchTerm, 'i');
        
        const query = {
            isActive: true,
            $or: [
                { name: { $regex: searchRegex } },
                { 'address.city': { $regex: searchRegex } },
                { 'address.state': { $regex: searchRegex } },
                { description: { $regex: searchRegex } }
            ]
        };

        const schools = await SchoolDetails.find(query)
            .limit(limit)
            .skip(skip)
            .sort(sort)
            .exec();

        logger.info(`Found ${schools.length} schools matching search: ${searchTerm}`);
        return schools;
    } catch (error) {
        logger.error('Error in searchSchools:', error);
        throw error;
    }
};
