const { redisClient } = require("../config/redis");

const getCache = async (key) => {
    const data = await redisClient.get(key);

    if (!data) {
        return null;
    }

    return JSON.parse(data);
};

const setCache = async (key, data, expiration = 60) => {
    await redisClient.set(
        key,
        JSON.stringify(data),
        {
            EX: expiration //TTL(TIME TO LIVE)
        }
    );
};

const deleteCache = async (key) => {
    await redisClient.del(key);
};

const deleteUserJobCache = async (userId) => {
    const keys = await redisClient.keys(`jobs:${userId}:*`);

    if (keys.length > 0) {
        await redisClient.del(keys);
    }
};

module.exports = {
    getCache,
    setCache,
    deleteCache,
    deleteUserJobCache
};