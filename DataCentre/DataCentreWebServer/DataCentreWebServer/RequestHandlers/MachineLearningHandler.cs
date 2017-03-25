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

        public MachineLearningHandler(MachineLearningHelper machineLearningHelper, MachineLearningFileHandler machineLearningFileHandler)
        {
            _machineLearningHelper = machineLearningHelper;
            _machineLearningFileHandler = machineLearningFileHandler;
        }

        public async Task<HttpResponseMessage> ReturnPreviousMovies(HttpRequestMessage request)
        {
            try
            {
                var requestData = await request.Content.ReadAsStringAsync();
                var machineLearningRequest = JsonConvert.DeserializeObject<MachineLearningMessage>(requestData);

                var userMovieLines = _machineLearningFileHandler.GetUserMovies(machineLearningRequest.UserID);

                Movie[] userMovies = null;
                if (userMovieLines != null)
                {
                    userMovies = _machineLearningHelper.ParseLines(userMovieLines);
                }

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

        public async Task<HttpResponseMessage> WatchMovie(HttpRequestMessage request)
        {
            try
            {
                LoggerHelper.Log("Watch Movie");

                var requestData = await request.Content.ReadAsStringAsync();
                var machineLearningRequest = JsonConvert.DeserializeObject<MachineLearningMessage>(requestData);

                LoggerHelper.Log(machineLearningRequest.RequestedMovieID);

                var lines = _machineLearningFileHandler.GetMovieLinesFromDisk();

                //Should return array of 1
                var movie = _machineLearningHelper.GetMovie(lines, machineLearningRequest.RequestedMovieID);

                _machineLearningFileHandler.StoreUserResult(movie, machineLearningRequest.UserID);

                var linesToReturn = new Movie[]
                {
                    movie
                };

                var machineLearningMessage = new MachineLearningMessage()
                {
                    Results = linesToReturn
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

        public async Task<HttpResponseMessage> WatchRandomMovie(HttpRequestMessage request)
        {
            try
            {
                LoggerHelper.Log("Watch Random Movie");

                var requestData = await request.Content.ReadAsStringAsync();
                var machineLearningRequest = JsonConvert.DeserializeObject<MachineLearningMessage>(requestData);

                var lines = _machineLearningFileHandler.GetMovieLinesFromDisk();
                
                //Should return array of 1
                var randomMovie = _machineLearningHelper.ChooseRandomMovie(lines);

                _machineLearningFileHandler.StoreUserResult(randomMovie, machineLearningRequest.UserID);
                
                var linesToReturn = new Movie[]
                {
                    randomMovie
                };

                var machineLearningMessage = new MachineLearningMessage()
                {
                    Results = linesToReturn
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

        public HttpResponseMessage ReturnMovies(HttpRequestMessage request)
        {
            try
            {
                //Read movies from disk
                var lines = _machineLearningFileHandler.GetMovieLinesFromDisk();
                //Create subset of movies
                var linesToReturn = _machineLearningHelper.KMedoids(lines);
                
                //Return subset to Edge
                var machineLearningMessage = new MachineLearningMessage()
                {
                    Results = linesToReturn
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