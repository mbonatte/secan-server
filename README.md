# <i>SecAn</i> Flask Server
## Overview
This project integrates a Flask server with the <i>SecAn</i> package, a powerful tool for <i>Section Analysis</i> in engineering. The server acts as an interface to process <i>Section Analysis</i> requests, leveraging the capabilities of <i>SecAn</i> to calculate responses based on materials, geometry, and section properties.

## About <i>SecAn</i>
<i>SecAn</i> (<i>Section Analysis</i>) is a Python package designed for performing complex section analysis. It provides a range of functionalities to model different materials, geometries, and section properties, making it a versatile tool in the field of structural engineering.

## Flask Server
The Flask server in this project is designed to handle API requests for section analysis. Clients can send data in JSON format, specifying details about materials, geometry, and sections. The server processes these requests using <i>SecAn</i>, performs the necessary calculations, and returns the results.