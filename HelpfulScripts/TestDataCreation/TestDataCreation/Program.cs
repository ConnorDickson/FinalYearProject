using System;
using System.IO;

namespace TestDataCreation
{
    class Program
    {
        static void Main(string[] args)
        {
            var numberOfLines = 0;

            if (args.Length > 0)
            {
                int.TryParse(args[0], out numberOfLines);
            }

            if(numberOfLines == 0)
            {
                numberOfLines = 1000;
            }

            CreateData(numberOfLines);
        }

        private static void CreateData(int numberOfLines)
        {
            File.Create(Directory.GetCurrentDirectory().Trim('/') + "/TestData.txt");
            //need 4 true and falses in this format "True,True,False,False" with a line break
            
            for(int i = 0; i < numberOfLines; i++)
            {
                var rand = new Random();
                var result = rand.Next(2) <= 1 ? true : false;
                Console.WriteLine(result);
            }

            Console.ReadKey();
        }
    }
}
