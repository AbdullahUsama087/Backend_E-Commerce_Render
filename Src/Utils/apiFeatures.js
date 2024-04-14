import paginationFunction from "./pagination.js";

// mongooseQuery=>>>>> productModel.find()
// queryData=>>>>> await mongooseQuery
class ApiFeatures {
  constructor(mongooseQuery, queryData) {
    this.mongooseQuery = mongooseQuery;
    this.queryData = queryData;
  }

  // ============== Pagination =================
  pagination() {
    const { page, size } = this.queryData;
    const { limit, skip } = paginationFunction({ page, size });

    this.mongooseQuery.find().limit(limit).skip(skip);
    return this;
  }

  // ============== Sort =================
  sort() {
    this.mongooseQuery.sort(this.queryData.sort?.replaceAll("&", " "));
    return this;
  }

  // ============== Select =================
  select() {
    this.mongooseQuery.select(this.queryData.select?.replaceAll("&", " "));
    return this;
  }

  // ============== Filters =================
  filters() {
    const queryInstance = { ...this.queryData };
    const excludeKeyArr = ["page", "size", "sort", "select", "search"];
    excludeKeyArr.forEach((key) => delete queryInstance[key]);
    const queryString = JSON.parse(
      JSON.stringify(queryInstance).replace(
        /gt|gte|le|lte|in|nin|eq|neq|regex/g,
        (match) => `$${match}`
      )
    );

    this.mongooseQuery.find(queryString);
    return this;
  }
}

export default ApiFeatures;
