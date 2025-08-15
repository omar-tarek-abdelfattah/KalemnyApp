

export const findOne = async ({ model, filter = {}, select = '', populate = [] } = {}) => {
    return await model.findOne(filter).select(select).populate(populate)
}


export const findById = async ({ model, id, select = '', populate = [], lean = false } = {}) => {
    if (!lean) {
        return await model.findById(id).select(select).populate(populate)
    }
    return await model.findById(id).select(select).populate(populate).lean()
}

export const create = async ({
    model,
    data = [{}],
    options = { validateBeforeSave: true }
}) => {
    return await model.create(data, options)
}
export const updateOne = async ({ model, filter = {}, data = {}, options = { runValidators: true } } = {}) => {
    return await model.updateOne(filter, { ...data, $inc: { _v: true } }, options)
}
export const findOneAndUpdate = async ({ model, filter = {}, data = {}, options = { runValidators: true, new: true } } = {}) => {
    return await model.findOneAndUpdate(filter,
        {
            ...data,
            $inc: { __v: true }
        },
        options)
}
export const findOneAndUpdateWithoutVersioning = async ({ model, filter = {}, data = {}, options = { runValidators: true, new: true } } = {}) => {
    return await model.findOneAndUpdate(filter,
        {
            ...data
        },
        options)
}
export const deleteOne = async ({ model, filter = {} } = {}) => {
    return await model.deleteOne(filter)
}
export const deleteMany = async ({ model, filter = {} } = {}) => {
    return await model.deleteMany(filter)
}


