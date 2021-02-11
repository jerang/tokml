import u from "unist-builder";
import x from "xastscript";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import toXml from "xast-util-to-xml";

export function toKML(featureCollection: FeatureCollection) {
  return toXml(
    u("root", [
      x(
        "kml",
        { xmlns: "http://www.opengis.net/kml/2.2" },
        x(
          "Document",
          featureCollection.features.map((feature) => convertFeature(feature))
        )
      ),
    ])
  );
}

function convertFeature(feature: Feature) {
  return x("Placemark", [convertGeometry(feature.geometry)]);
}

function convertGeometry(geometry: Geometry) {
  switch (geometry.type) {
    case "Point":
      return x("Point", [
        x("coordinates", [u("text", geometry.coordinates.join(", "))]),
      ]);
    default:
      throw new Error("not supported yet");
  }
}

export function hexToKmlColor(
  hexColor: string,
  opacity: number
): string | undefined {
  if (opacity < 0.0 || opacity > 1.0) {
    throw new Error("Invalid opacity value, outside of 0-1 range");
  }

  hexColor = hexColor.replace("#", "").toLowerCase();

  if (hexColor.length === 3) {
    hexColor =
      hexColor[0] +
      hexColor[0] +
      hexColor[1] +
      hexColor[1] +
      hexColor[2] +
      hexColor[2];
  } else if (hexColor.length !== 6) {
    return undefined;
  }

  const r = hexColor.substring(0, 2);
  const g = hexColor.substring(2, 4);
  const b = hexColor.substring(4, 6);

  let o = Math.floor(opacity * 255)
    .toString(16)
    .padStart(2, "0");

  return o + b + g + r;
}

/*



function root(geojson: GeoJSON) {
  switch (geojson.type) {
    case "FeatureCollection":
      if (!_.features) return "";
      return _.features.map(feature(options)).join("");
    case "Feature":
      return feature(options)(_);
    default:
      return feature(options)({
        type: "Feature",
        geometry: _,
        properties: {},
      });
  }
}

function feature(options, styleHashesArray) {
  return function (_) {
    if (!_.properties || !geometry.valid(_.geometry)) return "";
    var geometryString = geometry.any(_.geometry);
    if (!geometryString) return "";

    var styleDefinition = "",
      styleReference = "";
    if (options.simplestyle) {
      var styleHash = hashStyle(_.properties);
      if (styleHash) {
        if (geometry.isPoint(_.geometry) && hasMarkerStyle(_.properties)) {
          if (styleHashesArray.indexOf(styleHash) === -1) {
            styleDefinition = markerStyle(_.properties, styleHash);
            styleHashesArray.push(styleHash);
          }
          styleReference = tag("styleUrl", "#" + styleHash);
        } else if (
          (geometry.isPolygon(_.geometry) || geometry.isLine(_.geometry)) &&
          hasPolygonAndLineStyle(_.properties)
        ) {
          if (styleHashesArray.indexOf(styleHash) === -1) {
            styleDefinition = polygonAndLineStyle(_.properties, styleHash);
            styleHashesArray.push(styleHash);
          }
          styleReference = tag("styleUrl", "#" + styleHash);
        }
        // Note that style of GeometryCollection / MultiGeometry is not supported
      }
    }

    return (
      styleDefinition +
      tag(
        "Placemark",
        name(_.properties, options) +
          description(_.properties, options) +
          extendeddata(_.properties) +
          timestamp(_.properties, options) +
          geometryString +
          styleReference
      )
    );
  };
}



function name(_, options) {
  return _[options.name] ? tag("name", encode(_[options.name])) : "";
}

function description(_, options) {
  return _[options.description]
    ? tag("description", encode(_[options.description]))
    : "";
}

function timestamp(_, options) {
  return _[options.timestamp]
    ? tag("TimeStamp", tag("when", encode(_[options.timestamp])))
    : "";
}

// ## Geometry Types
//
// https://developers.google.com/kml/documentation/kmlreference#geometry
var geometry = {
  Point: function (_) {
    return tag("Point", tag("coordinates", _.coordinates.join(",")));
  },
  LineString: function (_) {
    return tag("LineString", tag("coordinates", linearring(_.coordinates)));
  },
  Polygon: function (_) {
    if (!_.coordinates.length) return "";
    var outer = _.coordinates[0],
      inner = _.coordinates.slice(1),
      outerRing = tag(
        "outerBoundaryIs",
        tag("LinearRing", tag("coordinates", linearring(outer)))
      ),
      innerRings = inner
        .map(function (i) {
          return tag(
            "innerBoundaryIs",
            tag("LinearRing", tag("coordinates", linearring(i)))
          );
        })
        .join("");
    return tag("Polygon", outerRing + innerRings);
  },
  MultiPoint: function (_) {
    if (!_.coordinates.length) return "";
    return tag(
      "MultiGeometry",
      _.coordinates
        .map(function (c) {
          return geometry.Point({ coordinates: c });
        })
        .join("")
    );
  },
  MultiPolygon: function (_) {
    if (!_.coordinates.length) return "";
    return tag(
      "MultiGeometry",
      _.coordinates
        .map(function (c) {
          return geometry.Polygon({ coordinates: c });
        })
        .join("")
    );
  },
  MultiLineString: function (_) {
    if (!_.coordinates.length) return "";
    return tag(
      "MultiGeometry",
      _.coordinates
        .map(function (c) {
          return geometry.LineString({ coordinates: c });
        })
        .join("")
    );
  },
  GeometryCollection: function (_) {
    return tag("MultiGeometry", _.geometries.map(geometry.any).join(""));
  },
  valid: function (_) {
    return (
      _ &&
      _.type &&
      (_.coordinates ||
        (_.type === "GeometryCollection" &&
          _.geometries &&
          _.geometries.every(geometry.valid)))
    );
  },
  any: function (_) {
    if (geometry[_.type]) {
      return geometry[_.type](_);
    } else {
      return "";
    }
  },
  isPoint: function (_) {
    return _.type === "Point" || _.type === "MultiPoint";
  },
  isPolygon: function (_) {
    return _.type === "Polygon" || _.type === "MultiPolygon";
  },
  isLine: function (_) {
    return _.type === "LineString" || _.type === "MultiLineString";
  },
};

function linearring(_) {
  return _.map(function (cds) {
    return cds.join(",");
  }).join(" ");
}

// ## Data
function extendeddata(_) {
  return tag("ExtendedData", pairs(_).map(data).join(""));
}

function data(_) {
  return tag("Data", tag("value", encode(_[1])), [["name", encode(_[0])]]);
}

// ## Marker style
function hasMarkerStyle(_) {
  return !!(_["marker-size"] || _["marker-symbol"] || _["marker-color"]);
}

function markerStyle(_, styleHash) {
  return tag(
    "Style",
    tag("IconStyle", tag("Icon", tag("href", iconUrl(_)))) + iconSize(_),
    [["id", styleHash]]
  );
}

function iconUrl(_) {
  var size = _["marker-size"] || "medium",
    symbol = _["marker-symbol"] ? "-" + _["marker-symbol"] : "",
    color = (_["marker-color"] || "7e7e7e").replace("#", "");

  return (
    "https://api.tiles.mapbox.com/v3/marker/" +
    "pin-" +
    size.charAt(0) +
    symbol +
    "+" +
    color +
    ".png"
  );
}

function iconSize(_) {
  return tag("hotSpot", "", [
    ["xunits", "fraction"],
    ["yunits", "fraction"],
    ["x", 0.5],
    ["y", 0.5],
  ]);
}

// ## Polygon and Line style
function hasPolygonAndLineStyle(_) {
  for (var key in _) {
    if (
      {
        stroke: true,
        "stroke-opacity": true,
        "stroke-width": true,
        fill: true,
        "fill-opacity": true,
      }[key]
    )
      return true;
  }
}

function polygonAndLineStyle(_, styleHash) {
  var lineStyle = tag("LineStyle", [
    tag(
      "color",
      hexToKmlColor(_["stroke"], _["stroke-opacity"]) || "ff555555"
    ) + tag("width", _["stroke-width"] === undefined ? 2 : _["stroke-width"]),
  ]);

  var polyStyle = "";

  if (_["fill"] || _["fill-opacity"]) {
    polyStyle = tag("PolyStyle", [
      tag("color", hexToKmlColor(_["fill"], _["fill-opacity"]) || "88555555"),
    ]);
  }

  return tag("Style", lineStyle + polyStyle, [["id", styleHash]]);
}

// ## Style helpers
function hashStyle(_) {
  var hash = "";

  if (_["marker-symbol"]) hash = hash + "ms" + _["marker-symbol"];
  if (_["marker-color"])
    hash = hash + "mc" + _["marker-color"].replace("#", "");
  if (_["marker-size"]) hash = hash + "ms" + _["marker-size"];
  if (_["stroke"]) hash = hash + "s" + _["stroke"].replace("#", "");
  if (_["stroke-width"])
    hash = hash + "sw" + _["stroke-width"].toString().replace(".", "");
  if (_["stroke-opacity"])
    hash = hash + "mo" + _["stroke-opacity"].toString().replace(".", "");
  if (_["fill"]) hash = hash + "f" + _["fill"].replace("#", "");
  if (_["fill-opacity"])
    hash = hash + "fo" + _["fill-opacity"].toString().replace(".", "");

  return hash;
}
*/