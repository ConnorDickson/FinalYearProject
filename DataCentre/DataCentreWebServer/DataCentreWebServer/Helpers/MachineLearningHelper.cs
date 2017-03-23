using System;
using System.Collections.Generic;
using DataCentreWebServer.MachineLearning;
using System.Linq;

namespace DataCentreWebServer.Helpers
{
    public class MachineLearningHelper
    {
        MovieParser _movieParser;
        public MachineLearningHelper (MovieParser movieParser)
        {
            _movieParser = movieParser;
        }

        public string PerformEvaluation(MachineLearningMessage machineLearningRequest, List<string> prevResults)
        {
            var result = "";
            
            return result;
        }

        public Movie[] ParseLines(string[] lines)
        {
            return _movieParser.ParseMovies(lines);
        }

        public Movie[] KMedoids(string[] lines)
        {
            var movies = _movieParser.ParseMovies(lines);

            foreach (var movie in movies)
            {
                //Process vectors and perform nearst neighbour
                //k - evaluation to send a big variation of movies to Edge (maybe 1000?)
            }

            movies = movies.Take(10000).ToArray();

            return movies;
        }

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