<?xml version="1.0" encoding="ISO-8859-1"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:template match="/">
    <html>
    <head>
      <title>$FOLDER Fixtures</title>
      <link rel="stylesheet" type="text/css" media="all" href="cricket.css">
    </head>
    <body>
    <h1>2011 Season</h1>
      <table id="fixture">
        <tr>
          <th>Date</th>
          <th>Teams</th>
          <th>Score</th>
          <th>Summary</th>
        </tr>
        <xsl:for-each select="/fixtures/match">
          <xsl:apply-templates select="document(@file)/*" />
        </xsl:for-each>
      </table>
    </body>
    </html>
  </xsl:template>
        
  <xsl:template match="match">
      <tr>
        <td rowspan="2" class="date">
          <xsl:apply-templates select="day" /> - <xsl:apply-templates select="month" /> - <xsl:apply-templates select="year" />
        </td>
        <td class="team">
          <xsl:apply-templates select="visitors/team" />
        </td>
        <td class="score">
          <xsl:choose>
            <xsl:when test="visitors/boxscore">
              <a><xsl:attribute name="href"><xsl:value-of select="visitors/boxscore" /></xsl:attribute><xsl:apply-templates select="visitors/runs" />-<xsl:apply-templates select="visitors/wicketsLost" /></a>
            </xsl:when>
            <xsl:otherwise>
              <xsl:apply-templates select="visitors/runs" />-<xsl:apply-templates select="visitors/wicketsLost" />
            </xsl:otherwise>
          </xsl:choose>
        </td>
        <td rowspan="2" class="summary">
          <xsl:apply-templates select="summary" />
        </td>
      </tr>
      <tr>
        <td class="team">
          <xsl:apply-templates select="home/team" />
        </td>
        <td class="score">
          <xsl:choose>
            <xsl:when test="home/boxscore">
              <a><xsl:attribute name="href"><xsl:value-of select="home/boxscore" /></xsl:attribute><xsl:apply-templates select="home/runs" />-<xsl:apply-templates select="home/wicketsLost" /></a>
            </xsl:when>
            <xsl:otherwise>
              <xsl:apply-templates select="home/runs" />-<xsl:apply-templates select="home/wicketsLost" />
            </xsl:otherwise>
          </xsl:choose>
        </td>
      </tr>
      
  </xsl:template>
  
  <xsl:template match="player">
    <li>
      <xsl:apply-templates select="surname" />: 
    </li>
  </xsl:template>
        
</xsl:stylesheet>