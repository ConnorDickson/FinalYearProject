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

        internal Movie[] KMedoids(string[] lines)
        {
            var movies = _movieParser.ParseMovies(lines);

            foreach (var movie in movies)
            {
                //Process vectors and perform nearst neighbour
                //k - evaluation to send a big variation of movies to Edge (maybe 1000?)
            }

            movies = movies.Take(4).ToArray();

            return movies;
        }
    }
}