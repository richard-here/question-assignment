# Solution
## Explanation
The solution works by assigning a question to a country based on the country's and the question's ID. Some examples to show how this works.
```
Cycle 1
=======
Country 1 -> Question 1
Country 2 -> Question 2
...
Country N -> Question N

Cycle 2
=======
Country 1 -> Question 2
Country 2 -> Question 3
...
Country N -> Question N + 1
```

With `X` denoting the cycle number and `N` denoting the number of questions, when `X + Country ID` is larger than `N`, the function will loop the question assigned to that country to the questions with the lowest ID (using a mod operation).

The solution makes sure that no one country will be assigned the same question in one cycle (as long as the number of questions is larger than the number of countries). At the same time, the logic for question assignment is simple with a time complexity of O(1).

The most time-consuming operation in this solution is to get the question for the currently active cycle for a region, and this is only because there is a need to access the DB. To address the issue of having the DB finding the same data over and over again for a number of users in a region, we can simply cache the question for this cycle for the region, so that when users of the same region request the question of the cycle, the cache can be utilized instead. Note that in this solution, the cache will only store the question of the currently active cycle for each region after they have been fetched once. This is because the most accessed questions should be those that are assigned to the currently active cycle.

This solution also allows configuring the duration for each cycle for all regions. Without any extra mechanisms to prevent duplicate assigned questions for a region, updating the cycle after some questions have been assigned to a country may lead to previously assigned questions to be assigned again for a region.

## Scalability
As mentioned, the most time-consuming operation in the solution is DB fetching. As such, a cache was implemented. But this is on a locally run function scenario. For a production scenario, caching will not be done in-memory in the running machine (or VM). Instead, an in-memory database like Redis can be used.

To handle a large number of users hitting the service, using services like Cloud Functions will allow handling a large spike of user activities. These services allow us to cold-start our API-handling function to be able to readily handle low number of requests, and at the same time scale up the number of services to handle user activity spikes while balancing the load requests among spun-up services.

## Endpoints for Testing Purposes
1. `GET /cycle-config` -> displays the current cycle configuration
2. `PATCH /cycle-config` -> updates the cycle configuration. Accepts a body param of `cycleDuration` to update the cycle duration
3. `GET /countries/:countryId/question` -> gets the question for a particular country for a particular cycle. Accepts a path param of `countryId` and a query param of `cycle`. Defaults to the currently running cycle if the query param `cycle` is not provided. 

## Running Service Locally
1. Run `npm i`
2. Run `node index.js`

Endpoints are served locally at `http://localhost:3000`