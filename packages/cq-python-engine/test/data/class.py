import mycats

class Cat(object):

    def __init__(self, name):
        self.name = name

    def meow(self):
        print 'Im a talking cat'

pickles = Cat('pickles')

pickles.meow()
