from .suites import streamers
from .utils.runner import create_parser
from .utils.runner import run


def create_suites(context):
    return [
        streamers.tests(context),
    ]


def main():
    parser = create_parser("Run the backend system tests.")
    run("test", parser, create_suites)


main()
