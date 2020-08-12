import React, { PureComponent } from 'react';
import { Svg, G, Line, Text, Circle } from 'react-native-svg';
import * as d3 from 'd3';
import { Dimensions } from 'react-native';

const GRAPH_MARGIN = 20;
const GRAPH_BAR_WIDTH = 5;
const colors = {
	axis: 'black',
	bars: '#15AD13'
};

export default class LineChart extends PureComponent {
	render() {
		// Dimensions
		const windowWidth = Dimensions.get('window').width;
		const windowHeight = Dimensions.get('window').height;
		const SVGHeight = windowHeight / 4;
		const SVGWidth = windowWidth;
		const graphHeight = SVGHeight - 2 * GRAPH_MARGIN;
		const graphWidth = SVGWidth - 2 * GRAPH_MARGIN;
		const data = this.props.data.slice(-20);

		// X scale point
		const xDomain = data.map((item) => item.label);
		const xRange = [ 0, graphWidth ];
		const x = d3.scalePoint().domain(xDomain).range(xRange).padding(1);

		// Y scale linear
		const maxValue = d3.max(data, (d) => d.value);
		const minValue = d3.min(data, (d) => d.value);
		const lastValue = Math.trunc(data[data.length - 1].value * 100) / 100;
		const topValue = Math.ceil(maxValue);
		const botValue = Math.floor(minValue);
		const yDomain = [ botValue, topValue ];
		const yRange = [ 0, graphHeight ];
		const y = d3.scaleLinear().domain(yDomain).range(yRange);

		// top axis and middle axis
		const middleValue = lastValue;

		return (
			<Svg width={SVGWidth} height={SVGHeight}>
				<G y={graphHeight + GRAPH_MARGIN}>
					{/* Top value label */}
					<Text
						x={graphWidth}
						textAnchor="end"
						y={y(topValue) * -1 - 5}
						fontSize={12}
						fill="black"
						fillOpacity={0.4}
					>
						{topValue + ' ' + this.props.unit}
					</Text>

					{/* top axis */}
					<Line
						x1="0"
						y1={y(topValue) * -1}
						x2={graphWidth}
						y2={y(topValue) * -1}
						stroke={colors.axis}
						strokeWidth="0.5"
					/>
					{/* Middle value label */}
					<Text
						x={graphWidth}
						textAnchor="end"
						y={y(lastValue) * -1 - 5}
						fontSize={12}
						fill="black"
						fillOpacity={0.4}
					>
						{middleValue + ' ' + this.props.unit}
					</Text>
					{/* middle axis */}
					<Line
						x1="0"
						y1={y(middleValue) * -1}
						x2={graphWidth}
						y2={y(middleValue) * -1}
						stroke={colors.axis}
						strokeDasharray={[ 3, 3 ]}
						strokeWidth="0.5"
					/>
					{/* Bot value label */}
					<Text
						x={graphWidth}
						textAnchor="end"
						y={y(botValue) * -1 - 5}
						fontSize={12}
						fill="black"
						fillOpacity={0.4}
					>
						{botValue + ' ' + this.props.unit}
					</Text>
					{/* bottom axis */}
					<Line x1="0" y1="2" x2={graphWidth} y2="2" stroke={colors.axis} strokeWidth="0.5" />

					{/* bars */}
					{data.map(
						(item, index, arr) =>
							arr[index + 1] ? (
								<Line
									key={'line' + item.label}
									x1={x(item.label) - GRAPH_BAR_WIDTH / 2}
									y1={y(item.value) * -1}
									x2={x(arr[index + 1].label) - GRAPH_BAR_WIDTH / 2}
									y2={y(arr[index + 1].value) * -1}
									stroke={colors.bars}
									strokeWidth="5.5"
								/>
							) : (
								<Circle
									key={'line' + item.label}
									cx={x(item.label) - GRAPH_BAR_WIDTH / 2}
									cy={y(item.value) * -1}
									r="2"
									stroke={colors.bars}
									strokeWidth="5.5"
								/>
							)
					)}
				</G>
			</Svg>
		);
	}
}
