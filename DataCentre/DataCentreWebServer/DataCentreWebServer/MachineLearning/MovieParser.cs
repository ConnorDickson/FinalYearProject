using DataCentreWebServer.Helpers;

namespace DataCentreWebServer.MachineLearning
{
    public class MovieParser
    {
        public Movie[] ParseMovies(string[] rawMovies)
        {
            //QKMDVJDI 1961 37 37 24 31 3 64 False False True True
            var movies = new Movie[rawMovies.Length];

            for(int i = 0; i < rawMovies.Length; i++)
            {
                var rawMovie = rawMovies[i];

                var splitRawMovie = rawMovie.Split(' ');

                var movie = new Movie()
                {
                    MovieTitle = splitRawMovie[0],
                    Year = int.Parse(splitRawMovie[1]),
                    PercentageHorror = float.Parse(splitRawMovie[2]),
                    PercentageComedy = float.Parse(splitRawMovie[3]),
                    PercentageAction = float.Parse(splitRawMovie[4]),
                    PercentageAdventure = float.Parse(splitRawMovie[5]),
                    PercentageFantasy = float.Parse(splitRawMovie[6]),
                    PercentageRomance = float.Parse(splitRawMovie[7]),
                    ContainsViolence = bool.Parse(splitRawMovie[8]),
                    ContainsSexualScenes = bool.Parse(splitRawMovie[9]),
                    ContainsDrugUse = bool.Parse(splitRawMovie[10]),
                    ContainsFlashingImages = bool.Parse(splitRawMovie[11])
                };

                movies[i] = movie;
            }

            return movies;
        }
    }
}