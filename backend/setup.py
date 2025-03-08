"""
Setup configuration for the API Backend package
"""
from setuptools import setup, find_packages

setup(
    name='blogger-api',
    version='1.0.0',
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        'flask',
        'flask-cors',
        'werkzeug',
        'click',
        'flask-limiter',
    ],
    extras_require={
        'test': [
            'pytest',
            'pytest-flask',
            'pytest-cov',
        ],
    },
)
