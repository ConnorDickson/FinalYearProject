import unittest;

class PythonScriptTests(unittest.TestCase):
    def test_upper(self):
        self.assertEqual('foo'.upper(),'FOO')
    def test_upperfail(self):
        self.assertEqual('fooo'.upper(),'FOO')


if __name__ == '__main__':
    unittest.main();
