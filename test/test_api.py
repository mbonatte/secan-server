import unittest
import json
from flask.testing import FlaskClient
import secan as sa
import api.index as app

class TestFlaskApp(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Setup that is run once for all tests
        cls.app: FlaskClient = app.app.test_client()
        app.app.testing = True
    
    @staticmethod
    def get_test_section_data() -> dict:
        return {
            'materials': [
                {
                    'name': 'Concrete 40',
                    'type': 'Concrete',
                    'variables': {'fc': 40e6},
                },
                {
                    'name': 'Steel 400',
                    'type': 'SteelIdeal',
                    'variables': {'young': 200e9, 'fy': 400e6},
                },
            ],
            'geometries': [
                {
                    'name': 'Rectangle 1',
                    'type': 'RectSection',
                    'material': 'Concrete 40',
                    'center': [0, 0.25],
                    'variables': {'width': 0.3, 'height': 0.5},
                },
                {
                    'name': 'Rebar 1',
                    'type': 'Rebar',
                    'material': 'Steel 400',
                    'center': [-0.11, 0.04],
                    'variables': {'diameter': 0.02},
                },
                {
                    'name': 'Rebar 2',
                    'type': 'Rebar',
                    'material': 'Steel 400',
                    'center': [0.11, 0.04],
                    'variables': {'diameter': 0.02},
                },
            ],
        }

    @staticmethod
    def get_test_section() -> sa.Section:
        conc = sa.material.Concrete(fc=40e6)
        steel = sa.material.SteelIdeal(young=200e9, fy=400e6)
        rect_section = sa.geometry.RectSection(width=0.3, height=0.5, material=conc, center=(0, 0.25))
        section = sa.Section([rect_section])
        section.addSingleRebar(diameter=0.02, material=steel, position=(-0.11, 0.04))
        section.addSingleRebar(diameter=0.02, material=steel, position=(0.11, 0.04))
        return section
    
    def setUp(self):
        self.section = self.get_test_section()
        self.section_data = self.get_test_section_data()
        self.section_json = json.dumps(self.section_data)
        
    def test_create_section_from_json(self):
        with self.subTest("Valid Section"):
            section = app.create_section_from_json(self.section_data)
            self.assertIsNotNone(section)
            self.assertIsInstance(section, sa.Section)

        
        with self.subTest("Invalid Section"):
            modified_data = self.section_data
            modified_data['materials'][0]['name'] = 'InvalidType'
            modified_json = json.dumps(modified_data)
            with self.assertRaises(KeyError):
                app.create_section_from_json(modified_data)
        
    def test_calculate(self):
        response = self.app.post('/calculate/invalid_function',
                                 data=self.section_json,
                                 content_type='application/json')
        self.assertEqual(response.status_code, 404)
    
    def test_calculate_moment_curvature(self):
        # Define the parameters for the request
        k_max = 0.0125
        normal_force = -2e6

        # Make a POST request to the endpoint
        response = self.app.post('/calculate/moment_curvature',
                                 data=self.section_json,
                                 content_type='application/json',
                                 query_string={'k_max': k_max, 'normal_force': normal_force})

        # Check if the response is OK
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIn('moment', data)
        self.assertIn('curvature', data)

    def test_calculate_check_section(self):
        # Define the parameters for the request
        target_normal = -2e6
        target_moment = 4e5

        # Make a POST request to the endpoint
        response = self.app.post('/calculate/check_section',
                                 data=self.section_json,
                                 content_type='application/json',
                                 query_string={'target_normal': target_normal, 'target_moment': target_moment})

        # Check if the response is OK
        self.assertEqual(response.status_code, 200)

if __name__ == '__main__':
    unittest.main()