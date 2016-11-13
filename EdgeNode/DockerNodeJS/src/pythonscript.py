print('Hello from the python world');

import httplib;

#conn = httplib.HTTPConnection("http://connor-pc:3000");
#conn.request("GET","/api/python");
#res = conn.getresponse();
#print res.content;

import urllib2;
content = urllib2.urlopen("http://connor-pc:3000/api/python").read();
print content;
