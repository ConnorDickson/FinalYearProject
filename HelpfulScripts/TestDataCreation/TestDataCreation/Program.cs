using System;
using System.IO;

namespace TestDataCreation
{
    class Program
    {
        static char[] alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".ToCharArray();
        static Random rng = new Random();
        static string filePath = Directory.GetCurrentDirectory().Trim('/') + "/TestData.txt";

        static void Main(string[] args)
        {
            //Create test movie vectors

            for (int i = 0; i < 1000000; i++)
            {
                //Method for randomising each variable
                string movieName = alphabet[rng.Next(25)].ToString() + alphabet[rng.Next(25)] + alphabet[rng.Next(25)] + alphabet[rng.Next(25)] + alphabet[rng.Next(25)] + alphabet[rng.Next(25)] + alphabet[rng.Next(25)] + alphabet[rng.Next(25)];
                var movieYear = RandomYearOfCreation();
                var percentageHorror = RandomPercentage();
                var percentageComedy = RandomPercentage();
                var percentageAction = RandomPercentage();
                var percentageAdventure = RandomPercentage();
                var percentageFantasy = RandomPercentage();
                var percentageRomance = RandomPercentage();
                var containsViolence = RandomBoolean();
                var containsSexualScenes = RandomBoolean();
                var containsDrugUse = RandomBoolean();
                var containsFlashingImages = RandomBoolean();

                //Method to write entire movie to disk
                string movieInfo = movieName + " " +
                                movieYear.ToString() + " " +
                                percentageHorror + " " +
                                percentageComedy + " " +
                                percentageAction + " " +
                                percentageAdventure + " " +
                                percentageFantasy + " " +
                                percentageRomance + " " +
                                containsViolence + " " +
                                containsSexualScenes + " " +
                                containsDrugUse + " " +
                                containsFlashingImages;

                WriteDataToDisk(movieInfo);
            }
        }

        private static void WriteDataToDisk(string movieInfo)
        {
            File.AppendAllText(filePath, movieInfo + Environment.NewLine);
        }

        private static int RandomYearOfCreation()
        {
            return rng.Next(1960, 2017);
        }

        private static int RandomPercentage()
        {
            return rng.Next(100);
        }

        private static bool RandomBoolean()
        {
            return rng.Next(2) == 0;
        }
    }
}
