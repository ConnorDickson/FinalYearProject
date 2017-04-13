using System;
using DataCentreWebServer.MachineLearning;

namespace DataCentreWebServer.Helpers
{
    // provides helper methods for machine learning requests
    public class MachineLearningHelper
    {
        MovieParser _movieParser;
        KMeansHelper _kmeansHelper;

        /// <summary>
        /// Utalises dependancy injection
        /// </summary>
        /// <param name="movieParser"></param>
        /// <param name="kmeansHelper"></param>
        public MachineLearningHelper (MovieParser movieParser, KMeansHelper kmeansHelper)
        {
            _movieParser = movieParser;
            _kmeansHelper = kmeansHelper;
        }
        
        public Movie[] ParseLines(string[] lines)
        {
            if(lines == null)
            {
                return null;
            }

            return _movieParser.ParseMovies(lines);
        }

        /// <summary>
        /// performs an operation to get a subset of the movies on disk 
        /// that is small enough to be sent to the edge
        /// </summary>
        /// <param name="lines"></param>
        /// <returns></returns>
        public Movie[] KMeans(string[] lines)
        {
            var movies = _movieParser.ParseMovies(lines);
            
            return _kmeansHelper.kmeans(movies, 10000);
        }

        /// <summary>
        /// Returns a movie at random
        /// </summary>
        /// <param name="lines"></param>
        /// <returns></returns>
        public Movie ChooseRandomMovie(string[] lines)
        {
            Random rng = new Random();

            int movieNumber = rng.Next(Constants.MachineLearning.MaxNumMovies);
            var movies = _movieParser.ParseMovies(lines);
            if(movies.Length > movieNumber)
            {
                return movies[movieNumber];
            }

            return null;
        }

        /// <summary>
        /// Gets the movie on disk with the specific ID if it exists
        /// </summary>
        /// <param name="lines"></param>
        /// <param name="requestedMovieID"></param>
        /// <returns></returns>
        public Movie GetMovie(string[] lines, string requestedMovieID)
        {
            int movieID;

            if (!int.TryParse(requestedMovieID, out movieID))
            {
                return null;
            }

            var movies = _movieParser.ParseMovies(lines);
            foreach(var movie in movies)
            {
                if(movie.ID == movieID)
                {
                    return movie;
                }
            }

            return null;
        }
    }
}