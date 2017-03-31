using System;
using System.Collections.Generic;
using DataCentreWebServer.MachineLearning;
using System.Linq;

namespace DataCentreWebServer.Helpers
{
    // provides helper methods for machine learning requests
    public class MachineLearningHelper
    {
        MovieParser _movieParser;
        /// <summary>
        /// utalises dependancy injection
        /// </summary>
        /// <param name="movieParser"></param>
        public MachineLearningHelper (MovieParser movieParser)
        {
            _movieParser = movieParser;
        }
        
        public Movie[] ParseLines(string[] lines)
        {
            return _movieParser.ParseMovies(lines);
        }

        /// <summary>
        /// performs an operation to get a subset of the movies on disk 
        /// that is small enough to be sent to the edge
        /// </summary>
        /// <param name="lines"></param>
        /// <returns></returns>
        public Movie[] KMedoids(string[] lines)
        {
            var movies = _movieParser.ParseMovies(lines);

            KMeans kmeans = new KMeans();

            kmeans.kmeans(movies);

            foreach (var movie in movies)
            {
                //Process vectors and perform nearst neighbour
                //k - evaluation to send a big variation of movies to Edge (maybe 1000?)
            }

            movies = movies.Take(10000).ToArray();

            return movies;
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