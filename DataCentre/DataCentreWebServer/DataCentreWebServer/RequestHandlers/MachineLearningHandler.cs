using System.Net;
using System.Net.Http;
using DataCentreWebServer.Helpers;
using System.Threading.Tasks;
using Newtonsoft.Json;
using DataCentreWebServer.MachineLearning;
using System;

namespace DataCentreWebServer.RequestHandlers
{
    public class MachineLearningHandler
    {
        private MachineLearningHelper _machineLearningHelper;
        private MachineLearningFileHandler _machineLearningFileHandler;
        //Utalises dependancy injection
        public MachineLearningHandler(MachineLearningHelper machineLearningHelper, MachineLearningFileHandler machineLearningFileHandler)
        {
            _machineLearningHelper = machineLearningHelper;
            _machineLearningFileHandler = machineLearningFileHandler;
        }

        /// <summary>
        /// Uses the injected helpers to get the users previous movies.
        /// Controls the logic for handling the request
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        public async Task<HttpResponseMessage> ReturnPreviousMovies(HttpRequestMessage request)
        {
            try
            {
                //get the message from the user
                var requestData = await request.Content.ReadAsStringAsync();
                var machineLearningRequest = JsonConvert.DeserializeObject<MachineLearningMessage>(requestData);

                //get the raw movie line from disk that the user has watched
                var userMovieLines = _machineLearningFileHandler.GetUserMovies(machineLearningRequest.UserID);

                //try to parse this into an array of movie objects
                Movie[] userMovies = null;
                if (userMovieLines != null)
                {
                    userMovies = _machineLearningHelper.ParseLines(userMovieLines);
                }

                //return this message to the user
                machineLearningRequest.Results = userMovies;
                var jsonString = JsonConvert.SerializeObject(machineLearningRequest);
                var response = new HttpResponseMessage();
                response.StatusCode = HttpStatusCode.OK;
                response.Content = new StringContent(jsonString);
                return response;
            }
            catch(Exception ex)
            {
                LoggerHelper.Log("An Exception occurred: " + ex.Message + "\n" + ex.StackTrace);

                return new HttpResponseMessage()
                {
                    StatusCode = HttpStatusCode.InternalServerError
                };
            }
        }

        /// <summary>
        /// Watch the requested movie
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        public async Task<HttpResponseMessage> WatchMovie(HttpRequestMessage request)
        {
            try
            {
                // get the user message
                var requestData = await request.Content.ReadAsStringAsync();
                var machineLearningRequest = JsonConvert.DeserializeObject<MachineLearningMessage>(requestData);

                // get all the lines on disk
                var lines = _machineLearningFileHandler.GetMovieLinesFromDisk();

                // returns the movie
                var movie = _machineLearningHelper.GetMovie(lines, machineLearningRequest.RequestedMovieID);

                //save the fact they watched this movie
                _machineLearningFileHandler.StoreUserResult(movie, machineLearningRequest.UserID);

                //Return data to requesting user
                var linesToReturn = new Movie[]
                {
                    movie
                };

                machineLearningRequest.Results = linesToReturn;
                
                var jsonString = JsonConvert.SerializeObject(machineLearningRequest);

                return new HttpResponseMessage()
                {
                    StatusCode = HttpStatusCode.OK,
                    Content = new StringContent(jsonString)
                };
            }
            catch (Exception ex)
            {
                LoggerHelper.Log("An Exception occurred: " + ex.Message + "\n" + ex.StackTrace);

                return new HttpResponseMessage()
                {
                    StatusCode = HttpStatusCode.InternalServerError
                };
            }
        }

        /// <summary>
        /// Watch a movie at random
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        public async Task<HttpResponseMessage> WatchRandomMovie(HttpRequestMessage request)
        {
            try
            {
                // get requesting user data
                var requestData = await request.Content.ReadAsStringAsync();
                var machineLearningRequest = JsonConvert.DeserializeObject<MachineLearningMessage>(requestData);

                // get all movies
                var lines = _machineLearningFileHandler.GetMovieLinesFromDisk();
                
                // watch a movie at random
                var randomMovie = _machineLearningHelper.ChooseRandomMovie(lines);

                // store the fact this movie was watched
                _machineLearningFileHandler.StoreUserResult(randomMovie, machineLearningRequest.UserID);
                
                //return movie data to requesting user
                var linesToReturn = new Movie[]
                {
                    randomMovie
                };

                machineLearningRequest.Results = linesToReturn;
                
                var jsonString = JsonConvert.SerializeObject(machineLearningRequest);

                return new HttpResponseMessage()
                {
                    StatusCode = HttpStatusCode.OK,
                    Content = new StringContent(jsonString)
                };
            }
            catch (Exception ex)
            {
                LoggerHelper.Log("An Exception occurred: " + ex.Message + "\n" + ex.StackTrace);

                return new HttpResponseMessage()
                {
                    StatusCode = HttpStatusCode.InternalServerError
                };
            }
        }

        /// <summary>
        /// Returns a subset of the movies stored at the data centre to the Edge Node
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        public HttpResponseMessage ReturnMovies(HttpRequestMessage request)
        {
            try
            {
                var movieClusterLines = _machineLearningFileHandler.ReadMovieClusterSubset();
                var movieClusterSubset = _machineLearningHelper.ParseLines(movieClusterLines);
                if(movieClusterSubset == null)
                {
                    LoggerHelper.Log("Existing movie cluster data was null");

                    // read movies from disk
                    var lines = _machineLearningFileHandler.GetMovieLinesFromDisk();

                    // create subset of movies
                    movieClusterSubset = _machineLearningHelper.KMeans(lines);

                    _machineLearningFileHandler.WriteClusteredSubset(movieClusterSubset);
                }

                LoggerHelper.Log("Got movie cluster data");

                // return subset to Edge
                var machineLearningMessage = new MachineLearningMessage()
                {
                    Results = movieClusterSubset
                };

                var jsonString = JsonConvert.SerializeObject(machineLearningMessage);

                return new HttpResponseMessage()
                {
                    StatusCode = HttpStatusCode.OK,
                    Content = new StringContent(jsonString)
                };
            }
            catch (Exception ex)
            {
                LoggerHelper.Log("An Exception occurred: " + ex.Message + "\n" + ex.StackTrace);

                return new HttpResponseMessage()
                {
                    StatusCode = HttpStatusCode.InternalServerError
                };
            }
        }
    }
}