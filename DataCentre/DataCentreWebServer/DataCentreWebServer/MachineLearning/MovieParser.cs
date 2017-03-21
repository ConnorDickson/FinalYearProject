namespace DataCentreWebServer.MachineLearning
{
    public class MovieParser
    {
        public Movie[] ParseMovies(string[] rawMovies)
        {
            //1 QKMDVJDI 1961 37 37 24 31 3 64 False False True True
            var movies = new Movie[rawMovies.Length];

            for(int i = 0; i < rawMovies.Length; i++)
            {
                var rawMovie = rawMovies[i];

                var splitRawMovie = rawMovie.Split(' ');

                var movie = new Movie()
                {
                    ID = int.Parse(splitRawMovie[0]),
                    Title = splitRawMovie[1],
                    Year = int.Parse(splitRawMovie[2]),
                    PercentageHorror = float.Parse(splitRawMovie[3]),
                    PercentageComedy = float.Parse(splitRawMovie[4]),
                    PercentageAction = float.Parse(splitRawMovie[5]),
                    PercentageAdventure = float.Parse(splitRawMovie[6]),
                    PercentageFantasy = float.Parse(splitRawMovie[7]),
                    PercentageRomance = float.Parse(splitRawMovie[8]),
                    ContainsViolence = bool.Parse(splitRawMovie[9]),
                    ContainsSexualScenes = bool.Parse(splitRawMovie[10]),
                    ContainsDrugUse = bool.Parse(splitRawMovie[11]),
                    ContainsFlashingImages = bool.Parse(splitRawMovie[12])
                };

                movies[i] = movie;
            }

            return movies;
        }
    }
}